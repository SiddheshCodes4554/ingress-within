import { OtpProvider, OtpResult, OtpVerifyResult } from './otpProvider';

/**
 * Result structure for MSG91 server-side configuration validation.
 */
export interface Msg91ConfigValidation {
  isValid: boolean;
  authKeyPresent: boolean;
  templateIdPresent: boolean;
  senderId: string;
  otpExpiryMinutes: number;
  errors: string[];
}

/**
 * Validates required MSG91 server environment variables.
 */
export function validateMsg91Config(): Msg91ConfigValidation {
  const authKey = (process.env.MSG91_AUTH_KEY || '').trim();
  const templateId = (process.env.MSG91_TEMPLATE_ID || '').trim();
  const senderId = (process.env.MSG91_SENDER_ID || 'INGWRT').trim();
  const expiryRaw = parseInt(process.env.MSG91_OTP_EXPIRY || '5', 10);
  const otpExpiryMinutes = Number.isNaN(expiryRaw) || expiryRaw <= 0 ? 5 : expiryRaw;

  const errors: string[] = [];

  const authKeyPresent = Boolean(authKey && authKey !== 'your_msg91_auth_key_here');
  const templateIdPresent = Boolean(templateId && templateId !== 'your_msg91_dlt_template_id_here');

  if (!authKeyPresent) {
    errors.push('MSG91_AUTH_KEY is missing. Please configure your live MSG91 Auth Key in the environment.');
  }
  if (!templateIdPresent) {
    errors.push('MSG91_TEMPLATE_ID is missing. Please configure your live DLT-approved MSG91 Template ID in the environment.');
  }

  return {
    isValid: errors.length === 0,
    authKeyPresent,
    templateIdPresent,
    senderId,
    otpExpiryMinutes,
    errors
  };
}

/**
 * Normalizes any Indian phone number into MSG91 standard format: "91XXXXXXXXXX" (12 digits, no leading '+').
 */
export function normalizeMsg91Phone(phoneNumber: string): string {
  const cleanDigits = (phoneNumber || '').replace(/\D/g, '');
  if (cleanDigits.length === 10) {
    return `91${cleanDigits}`;
  }
  if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
    return cleanDigits;
  }
  if (cleanDigits.length > 10) {
    return `91${cleanDigits.slice(-10)}`;
  }
  return cleanDigits;
}

/**
 * Masks phone number for secure logging (e.g., "919876543210" -> "+91 98****3210").
 */
export function maskPhone(phoneNumber: string): string {
  const normalized = normalizeMsg91Phone(phoneNumber);
  if (normalized.length >= 10) {
    const last4 = normalized.slice(-4);
    const first2 = normalized.length === 12 ? normalized.slice(2, 4) : normalized.slice(0, 2);
    return `+91 ${first2}****${last4}`;
  }
  return '***';
}

/**
 * Production-ready MSG91 OTP Provider integrating with official MSG91 SendOTP v5 and Verify OTP APIs.
 * Adheres strictly to the OtpProvider interface.
 */
export class Msg91OtpProvider implements OtpProvider {
  private readonly sendOtpUrl = 'https://control.msg91.com/api/v5/otp';
  private readonly verifyOtpUrl = 'https://control.msg91.com/api/v5/otp/verify';
  private readonly requestTimeoutMs = 10000; // 10 seconds timeout

  constructor() {
    const validation = validateMsg91Config();
    if (!validation.isValid) {
      console.warn(`[MSG91 Production Warning] ${validation.errors.join(' | ')}`);
    } else {
      console.log(`[MSG91 Production] Initialized live OTP Provider (Sender ID: ${validation.senderId}, Expiry: ${validation.otpExpiryMinutes}m).`);
    }
  }

  /**
   * Dispatches live OTP via MSG91 SendOTP API v5.
   */
  async sendOtp(phoneNumber: string, rateLimitCount: number = 0): Promise<OtpResult> {
    const validation = validateMsg91Config();
    const normalizedMobile = normalizeMsg91Phone(phoneNumber);
    const masked = maskPhone(phoneNumber);

    // 1. Validate Phone Number format
    if (!/^91[6-9]\d{9}$/.test(normalizedMobile)) {
      return {
        success: false,
        message: "That doesn't look like a valid Indian mobile number."
      };
    }

    // 2. Validate Environment Configuration
    if (!validation.isValid) {
      console.error(`[MSG91 Production] Send OTP blocked: ${validation.errors.join('; ')}`);
      return {
        success: false,
        message: 'SMS verification service is currently unconfigured. Please contact support.'
      };
    }

    try {
      const authKey = process.env.MSG91_AUTH_KEY!.trim();
      const templateId = process.env.MSG91_TEMPLATE_ID!.trim();

      console.log(`[MSG91 Production] Dispatching OTP to ${masked} (Expiry: ${validation.otpExpiryMinutes}m, Attempt: ${rateLimitCount})`);

      const url = new URL(this.sendOtpUrl);
      url.searchParams.set('template_id', templateId);
      url.searchParams.set('mobile', normalizedMobile);
      url.searchParams.set('authkey', authKey);
      url.searchParams.set('otp_expiry', String(validation.otpExpiryMinutes));
      url.searchParams.set('otp_length', '6');

      const payload: Record<string, any> = {
        template_id: templateId,
        mobile: normalizedMobile,
        otp_length: 6,
        otp_expiry: validation.otpExpiryMinutes
      };

      if (validation.senderId) {
        payload.sender = validation.senderId;
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.requestTimeoutMs)
      });

      const data = await response.json().catch(() => ({}));

      const isSuccess = response.ok && (data.type === 'success' || data.type === 'SUCCESS' || !data.type);

      if (!isSuccess || data.type === 'error') {
        const errorMsg = data.message || `MSG91 Gateway returned HTTP ${response.status}`;
        console.error(`[MSG91 Production] Send OTP failed for ${masked}:`, errorMsg);
        return {
          success: false,
          message: data.message || "We couldn't send your verification code right now. Please try again."
        };
      }

      console.log(`[MSG91 Production] OTP successfully dispatched to ${masked}. Message: ${data.message || 'Success'}`);

      return {
        success: true,
        message: 'Code sent successfully.',
        resendInSeconds: 30
      };
    } catch (err: any) {
      const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
      const logMessage = isTimeout ? 'Request timed out after 10s' : err.message;
      console.error(`[MSG91 Production] Network error sending OTP to ${masked}: ${logMessage}`);

      return {
        success: false,
        message: isTimeout 
          ? 'Network timeout connecting to SMS gateway. Please try again.' 
          : 'A connection issue occurred while sending your code. Please try again.'
      };
    }
  }

  /**
   * Verifies live OTP via MSG91 Verify OTP API v5.
   */
  async verifyOtp(phoneNumber: string, code: string): Promise<OtpVerifyResult> {
    const validation = validateMsg91Config();
    const normalizedMobile = normalizeMsg91Phone(phoneNumber);
    const masked = maskPhone(phoneNumber);

    // 1. Validate OTP format
    if (!code || !/^\d{4,8}$/.test(code.trim())) {
      return {
        success: false,
        message: "That code didn't match. Try again.",
        code: 'AUTH_OTP_MISMATCH'
      };
    }

    // 2. Validate Environment Configuration
    if (!validation.isValid) {
      console.error(`[MSG91 Production] Verify OTP blocked: ${validation.errors.join('; ')}`);
      return {
        success: false,
        message: 'SMS verification service is currently unconfigured. Please contact support.',
        code: 'CONFIG_ERROR'
      };
    }

    try {
      const authKey = process.env.MSG91_AUTH_KEY!.trim();
      console.log(`[MSG91 Production] Verifying OTP for ${masked}`);

      const verifyUrl = new URL(this.verifyOtpUrl);
      verifyUrl.searchParams.set('otp', code.trim());
      verifyUrl.searchParams.set('mobile', normalizedMobile);
      verifyUrl.searchParams.set('authkey', authKey);

      const response = await fetch(verifyUrl.toString(), {
        method: 'GET',
        headers: {
          'authkey': authKey,
          'accept': 'application/json'
        },
        signal: AbortSignal.timeout(this.requestTimeoutMs)
      });

      const data = await response.json().catch(() => ({}));

      const isSuccess = response.ok && (
        data.type === 'success' || 
        data.type === 'SUCCESS' ||
        (data.message && /success|verified/i.test(data.message))
      );

      if (isSuccess) {
        console.log(`[MSG91 Production] OTP verified successfully for ${masked}`);
        return {
          success: true,
          message: 'Verified successfully.'
        };
      }

      // Handle MSG91 error states
      const rawMessage = (data.message || '').toLowerCase();
      console.warn(`[MSG91 Production] Verification failed for ${masked}. Response:`, data.message || response.statusText);

      if (rawMessage.includes('expired')) {
        return {
          success: false,
          message: 'That code has expired.',
          code: 'AUTH_OTP_EXPIRED'
        };
      }

      if (rawMessage.includes('limit') || rawMessage.includes('maximum') || rawMessage.includes('blocked') || rawMessage.includes('exceeded')) {
        return {
          success: false,
          message: 'Please wait before requesting another code.',
          code: 'RATE_LIMIT_EXCEEDED'
        };
      }

      return {
        success: false,
        message: data.message || "That code didn't match. Try again.",
        code: 'AUTH_OTP_MISMATCH'
      };
    } catch (err: any) {
      const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
      const logMessage = isTimeout ? 'Request timed out after 10s' : err.message;
      console.error(`[MSG91 Production] Network error verifying OTP for ${masked}: ${logMessage}`);

      return {
        success: false,
        message: isTimeout 
          ? 'Verification timed out. Please check your connection and try again.' 
          : 'An unexpected verification error occurred. Please try again.',
        code: 'NETWORK_ISSUE'
      };
    }
  }
}
