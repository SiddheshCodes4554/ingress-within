import { supabase } from '../lib/db';
import { signJwt, generateToken, hashOtp } from '../utils/crypto';

export interface EstablishSessionResult {
  success: boolean;
  user: {
    id: string;
    phone_number: string;
    name: string | null;
    is_active: boolean;
    created_at: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  static async establishSession(
    phone_number: string,
    deviceId: string,
    deviceName: string,
    ipAddress: string,
    userAgent: string,
    providerUserId?: string
  ): Promise<EstablishSessionResult> {
    // 1. Silent Registration: Query or create user
    let userRecord;
    let isNewUser = false;

    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phone_number)
      .maybeSingle();

    if (findError) {
      throw new Error(`Failed to query user: ${findError.message}`);
    }

    if (!existingUser) {
      isNewUser = true;
      const insertPayload: any = { phone_number };
      if (providerUserId) {
        insertPayload.id = providerUserId;
      }

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert(insertPayload)
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      userRecord = newUser;

      // Initialize defaults for consents & preferences
      await supabase
        .from('consents')
        .insert({
          user_id: newUser.id,
          consent_type: 'terms_and_privacy',
          version: 'v1.0.0',
          ip_address: ipAddress
        });

      await supabase
        .from('notification_preferences')
        .insert({
          user_id: newUser.id,
          sms_reminders: true,
          whatsapp_reminders: false,
          digest_frequency: 'daily'
        });
    } else {
      userRecord = existingUser;
    }

    // 2. Generate session tokens
    const rawRefreshToken = generateToken();
    const hashedRefreshToken = hashOtp(rawRefreshToken, 'session_salt_static_secret');
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Deactivate previous active sessions for this user + device combination
    const { error: deactivateError } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userRecord.id)
      .eq('device_id', deviceId)
      .eq('is_active', true);

    if (deactivateError) {
      console.warn(`[AuthService] Failed to deactivate older sessions for user ${userRecord.id}: ${deactivateError.message}`);
    }

    // Store Session
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userRecord.id,
        refresh_token_hash: hashedRefreshToken,
        device_id: deviceId,
        device_name: deviceName ? deviceName.substring(0, 100) : 'Browser',
        ip_address: ipAddress,
        user_agent: userAgent,
        session_state: { onboardingCompleted: !isNewUser },
        expires_at: sessionExpiresAt
      });

    if (sessionError) {
      throw new Error(`Failed to establish session: ${sessionError.message}`);
    }

    // 3. Generate access token (Expires in 30 days)
    const jwtSecret = process.env.JWT_SECRET || 'jwt_default_secret_dev';
    const accessToken = signJwt(
      {
        uid: userRecord.id,
        phone: userRecord.phone_number,
        did: deviceId
      },
      jwtSecret,
      30 * 24 * 60 * 60
    );

    // 4. Write Security Audit Logs
    await supabase.from('audit_logs').insert({
      user_id: userRecord.id,
      action: isNewUser ? 'auth.signup_success' : 'auth.login_success',
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: { device_id: deviceId, device_name: deviceName }
    });

    return {
      success: true,
      user: {
        id: userRecord.id,
        phone_number: userRecord.phone_number,
        name: userRecord.name,
        is_active: userRecord.is_active,
        created_at: userRecord.created_at
      },
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 30 * 24 * 60 * 60
    };
  }
}
