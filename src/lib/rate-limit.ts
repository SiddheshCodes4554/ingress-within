import { supabase } from './db';

interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
}

/**
 * Validates rate limit restrictions.
 * If Upstash Redis envs are configured, executes edge IP checks.
 * Otherwise, runs database check restricting phone numbers to max 3 OTP sends per 15 minutes.
 */
export async function checkRateLimit(phoneNumber: string, ipAddress: string): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Try Upstash Redis Edge rate limiting if variables are present
  if (upstashUrl && upstashToken) {
    try {
      const cleanUrl = upstashUrl.replace(/^https?:\/\//, '');
      const key = `rl:ip:${ipAddress.replace(/[:.]/g, '_')}`;
      
      const response = await fetch(`https://${cleanUrl}/eval`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${upstashToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          script: `
            local current = redis.call('get', KEYS[1])
            if current and tonumber(current) >= tonumber(ARGV[1]) then
              return tonumber(current)
            end
            local newVal = redis.call('incr', KEYS[1])
            if newVal == 1 then
              redis.call('expire', KEYS[1], tonumber(ARGV[2]))
            end
            return newVal
          `,
          keys: [key],
          args: ['60', '60'] // limit: 60 requests per 60 seconds
        })
      });

      const data = await response.json() as any;
      if (response.ok && data.result !== undefined) {
        const count = Number(data.result);
        return {
          allowed: count <= 60,
          count,
          limit: 60
        };
      }
    } catch (error) {
      console.warn('Upstash Redis check failed; falling back to DB rate limiting:', error);
    }
  }

  // 2. PostgreSQL Database-backed rate limiting per Phone Number (Max 3 OTP requests / 15 minutes)
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    // Count OTP entries for this phone number in the last 15 minutes
    const { count, error } = await supabase
      .from('otp_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('phone_number', phoneNumber)
      .gt('created_at', fifteenMinutesAgo);

    if (error) {
      // If table doesn't exist yet (local dev state), bypass checks to allow tests
      if (error.code === 'P0001' || error.message.includes('does not exist')) {
        return { allowed: true, count: 0, limit: 3 };
      }
      throw error;
    }

    const otpCount = count || 0;
    return {
      allowed: otpCount < 3,
      count: otpCount,
      limit: 3
    };
  } catch (error) {
    console.error('Database rate limit query error:', error);
    return {
      allowed: true, // Fail-open to avoid locking out users on system glitches
      count: 0,
      limit: 3
    };
  }
}
