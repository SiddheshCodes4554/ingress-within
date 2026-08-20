import { supabase, supabaseAuth } from '../lib/db';
import { sendOtpSms } from '../lib/sms';
import { generateSalt, hashOtp } from '../utils/crypto';

export interface OtpResult {
  success: boolean;
  message: string;
  resendInSeconds?: number;
}

export interface OtpVerifyResult {
  success: boolean;
  message: string;
  userId?: string; // Returns Supabase GoTrue Auth UID if present
  code?: string;   // Error code if any
}

export interface OtpProvider {
  sendOtp(phoneNumber: string, rateLimitCount: number): Promise<OtpResult>;
  verifyOtp(phoneNumber: string, code: string): Promise<OtpVerifyResult>;
}

// ----------------------------------------------------
// 1. Native Supabase OTP Provider
// ----------------------------------------------------
export class SupabaseOtpProvider implements OtpProvider {
  async sendOtp(phoneNumber: string): Promise<OtpResult> {
    try {
      const { error } = await supabaseAuth.auth.signInWithOtp({
        phone: phoneNumber
      });

      if (error) {
        console.error('Supabase signInWithOtp error:', error);
        return {
          success: false,
          message: error.message || "We couldn't verify your number right now."
        };
      }

      return {
        success: true,
        message: 'Code sent successfully.',
        resendInSeconds: 30
      };
    } catch (err: any) {
      console.error('SupabaseOtpProvider sendOtp fatal error:', err);
      return {
        success: false,
        message: err.message || 'An unexpected connection error occurred.'
      };
    }
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<OtpVerifyResult> {
    try {
      const { data, error } = await supabaseAuth.auth.verifyOtp({
        phone: phoneNumber,
        token: code,
        type: 'sms'
      });

      if (error || !data.user) {
        console.error('Supabase verifyOtp error:', error);
        const isExpired = error?.message?.toLowerCase().includes('expired') || false;
        return {
          success: false,
          message: error?.message || "That code didn't match. Try again.",
          code: isExpired ? 'AUTH_OTP_EXPIRED' : 'AUTH_OTP_MISMATCH'
        };
      }

      return {
        success: true,
        message: 'Verified successfully.',
        userId: data.user.id
      };
    } catch (err: any) {
      console.error('SupabaseOtpProvider verifyOtp fatal error:', err);
      return {
        success: false,
        message: err.message || 'An unexpected verification error occurred.'
      };
    }
  }
}

// ----------------------------------------------------
// 2. Custom Fast2SMS OTP Provider (database-backed)
// ----------------------------------------------------
export class Fast2SmsProvider implements OtpProvider {
  async sendOtp(phoneNumber: string, rateLimitCount: number): Promise<OtpResult> {
    try {
      const nowStr = new Date().toISOString();
      await supabase
        .from('otp_verifications')
        .update({ expires_at: nowStr })
        .eq('phone_number', phoneNumber)
        .is('verified_at', null)
        .gt('expires_at', nowStr);

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      const salt = generateSalt();
      const hashedCode = hashOtp(otpCode, salt);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const { error: dbError } = await supabase
        .from('otp_verifications')
        .insert({
          phone_number: phoneNumber,
          otp_hash: hashedCode,
          salt,
          attempts_count: 0,
          resend_count: rateLimitCount,
          expires_at: expiresAt
        });

      if (dbError) {
        console.error('Fast2SmsProvider DB insertion failed:', dbError);
        return {
          success: false,
          message: "We couldn't verify your number right now."
        };
      }

      const smsResult = await sendOtpSms(phoneNumber, otpCode);

      if (!smsResult.success) {
        console.error('Fast2SmsProvider SMS dispatch failed:', smsResult.message);
        await supabase
          .from('otp_verifications')
          .delete()
          .eq('phone_number', phoneNumber)
          .eq('otp_hash', hashedCode);

        return {
          success: false,
          message: "We couldn't verify your number right now."
        };
      }

      return {
        success: true,
        message: 'Code sent successfully.',
        resendInSeconds: 30
      };
    } catch (err: any) {
      console.error('Fast2SmsProvider sendOtp fatal error:', err);
      return {
        success: false,
        message: err.message || 'An unexpected connection error occurred.'
      };
    }
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<OtpVerifyResult> {
    try {
      const { data: records, error: dbError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('phone_number', phoneNumber)
        .is('verified_at', null)
        .order('created_at', { ascending: false });

      if (dbError || !records || records.length === 0) {
        return {
          success: false,
          message: "That code didn't match. Try again.",
          code: 'AUTH_OTP_MISMATCH'
        };
      }

      let otpRecord: any = null;
      for (const record of records) {
        const hashedInput = hashOtp(code, record.salt);
        if (hashedInput === record.otp_hash) {
          otpRecord = record;
          break;
        }
      }

      const now = Date.now();

      if (!otpRecord) {
        const latestRecord = records[0];
        const newAttempts = latestRecord.attempts_count + 1;
        await supabase
          .from('otp_verifications')
          .update({ attempts_count: newAttempts })
          .eq('id', latestRecord.id);

        if (newAttempts >= 3) {
          return {
            success: false,
            message: 'Please wait 10 minutes before trying again.',
            code: 'RATE_LIMIT_EXCEEDED'
          };
        }

        return {
          success: false,
          message: "That code didn't match. Try again.",
          code: 'AUTH_OTP_MISMATCH'
        };
      }

      const createdAtTime = new Date(otpRecord.created_at).getTime();
      const lockoutWindow = 10 * 60 * 1000;

      if (otpRecord.attempts_count >= 3) {
        if (now - createdAtTime < lockoutWindow) {
          return {
            success: false,
            message: 'Please wait 10 minutes before trying again.',
            code: 'RATE_LIMIT_EXCEEDED'
          };
        } else {
          return {
            success: false,
            message: 'That code has expired.',
            code: 'AUTH_OTP_EXPIRED'
          };
        }
      }

      const expiresAtTime = new Date(otpRecord.expires_at).getTime();
      if (now >= expiresAtTime) {
        return {
          success: false,
          message: 'That code has expired.',
          code: 'AUTH_OTP_EXPIRED'
        };
      }

      const nowStr = new Date().toISOString();
      await supabase
        .from('otp_verifications')
        .update({ verified_at: nowStr })
        .eq('id', otpRecord.id);

      return {
        success: true,
        message: 'Verified successfully.'
      };
    } catch (err: any) {
      console.error('Fast2SmsProvider verifyOtp fatal error:', err);
      return {
        success: false,
        message: err.message || 'An unexpected verification error occurred.'
      };
    }
  }
}

import { Msg91OtpProvider } from './msg91Provider';

// ----------------------------------------------------
// 3. Factory Function
// ----------------------------------------------------
export function getOtpProvider(): OtpProvider {
  const rawProvider = process.env.OTP_PROVIDER;
  const provider = (rawProvider || '').trim().toLowerCase();

  // If OTP_PROVIDER is explicitly configured, match against supported providers
  if (provider) {
    if (provider === 'msg91') {
      return new Msg91OtpProvider();
    }
    if (provider === 'supabase') {
      return new SupabaseOtpProvider();
    }
    if (provider === 'fast2sms') {
      return new Fast2SmsProvider();
    }
    
    // Explicitly reject unsupported provider configurations
    const errorMsg = `[OTP Provider Configuration Error] Unsupported OTP_PROVIDER "${rawProvider}". Supported values are "msg91", "supabase", or "fast2sms".`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // If OTP_PROVIDER is not set but MSG91_AUTH_KEY is configured, default to MSG91
  if (process.env.MSG91_AUTH_KEY) {
    return new Msg91OtpProvider();
  }

  // Default fallback when unconfigured
  return new SupabaseOtpProvider();
}
