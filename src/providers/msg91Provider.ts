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

  const authKeyPresent = Boolean(authKey && authKey !== 'mock_developer_key' && authKey !== 'your_msg91_auth_key_here');
  const templateIdPresent = Boolean(templateId && templateId !== 'your_msg91_dlt_template_id_here');

  if (!authKeyPresent) {
    errors.push('MSG91_AUTH_KEY is missing or invalid. Set your live MSG91 authentication key in the server environment.');
  }
  if (!templateIdPresent) {
    errors.push('MSG91_TEMPLATE_ID is missing or invalid. Set your live DLT-approved MSG91 template ID in the server environment.');
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
 * Normalizes any Indian phone number into MSG91 standard format: "91XXXXXXXXXX" (no leading '+', 12 digits total).
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
 * Production MSG91 OTP Provider using live MSG91 SendOTP v5 API.
 * Adheres strictly to the OtpProvider interface without any mock or simulation fallback.
 */
export class Msg91OtpProvider implements OtpProvider {
  private readonly baseUrl = 'https://control.msg91.com/api/v5/otp';

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

    if (!validation.isValid) {
      console.error(`[MSG91 Production] Send OTP blocked: ${validation.errors.join('; ')}`);
      return {
        success: false,
        message: "SMS service is not properly configured. Please contact administrator."
      };
    }

    try {
      const authKey = process.env.MSG91_AUTH_KEY!.trim();
      const templateId = process.env.MSG91_TEMPLATE_ID!.trim();

      console.log(`[MSG91 Production] Sending live OTP to ${masked} (Expiry: ${validation.otpExpiryMinutes}m, Attempt: ${rateLimitCount})`);

      const payload: Record<string, any> = {
        template_id: templateId,
        mobile: normalizedMobile,
        otp_length: 6,
        otp_expiry: validation.otpExpiryMinutes
      };

      if (validation.senderId) {
        payload.sender = validation.senderId;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.type === 'error') {
        const errorMsg = data.message || `MSG91 gateway error (HTTP ${response.status})`;
        console.error(`[MSG91 Production] Send OTP failed for ${masked}:`, errorMsg);
        return {
          success: false,
          message: data.message || "We couldn't send your verification code right now. Please try again."
        };
      }

      console.log(`[MSG91 Production] Live OTP successfully dispatched to ${masked}. Message: ${data.message || 'Success'}`);

      return {
        success: true,
        message: 'Code sent successfully.',
        resendInSeconds: 30
      };
    } catch (err: any) {
      console.error(`[MSG91 Production] Network or execution error sending OTP to ${masked}:`, err.message);
      return {
        success: false,
        message: 'A connection issue occurred while sending your code. Please try again.'
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

    if (!validation.isValid) {
      console.error(`[MSG91 Production] Verify OTP blocked: ${validation.errors.join('; ')}`);
      return {
        success: false,
        message: "SMS service is not properly configured. Please contact administrator.",
        code: 'CONFIG_ERROR'
      };
    }

    try {
      const authKey = process.env.MSG91_AUTH_KEY!.trim();
      console.log(`[MSG91 Production] Verifying live OTP for ${masked}`);

      const verifyUrl = new URL(`${this.baseUrl}/verify`);
      verifyUrl.searchParams.set('otp', code);
      verifyUrl.searchParams.set('mobile', normalizedMobile);

      const response = await fetch(verifyUrl.toString(), {
        method: 'GET',
        headers: {
          'authkey': authKey,
          'accept': 'application/json'
        }
      });

      const data = await response.json().catch(() => ({}));

      // MSG91 returns { type: "success", message: "OTP verified success" } on valid code
      if (response.ok && data.type === 'success') {
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

      if (rawMessage.includes('limit') || rawMessage.includes('maximum') || rawMessage.includes('blocked')) {
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
      console.error(`[MSG91 Production] Verification network error for ${masked}:`, err.message);
      return {
        success: false,
        message: 'An unexpected verification error occurred. Please try again.',
        code: 'NETWORK_ISSUE'
      };
    }
  }
}
