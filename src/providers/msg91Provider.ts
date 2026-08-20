import { OtpProvider, OtpResult, OtpVerifyResult } from './otpProvider';

/**
 * Result structure for MSG91 server-side configuration validation.
 */
export interface Msg91ConfigValidation {
  isValid: boolean;
  isSimulator: boolean;
  authKeyPresent: boolean;
  templateIdPresent: boolean;
  senderId: string;
  otpExpiryMinutes: number;
  errors: string[];
}

/**
 * Validates MSG91 server environment variables.
 * Safe to call at startup or per-request.
 */
export function validateMsg91Config(): Msg91ConfigValidation {
  const authKey = (process.env.MSG91_AUTH_KEY || '').trim();
  const templateId = (process.env.MSG91_TEMPLATE_ID || '').trim();
  const senderId = (process.env.MSG91_SENDER_ID || 'INGWRT').trim();
  const expiryRaw = parseInt(process.env.MSG91_OTP_EXPIRY || '5', 10);
  const otpExpiryMinutes = Number.isNaN(expiryRaw) || expiryRaw <= 0 ? 5 : expiryRaw;

  const isSimulator = !authKey || authKey === 'mock_developer_key';
  const errors: string[] = [];

  const authKeyPresent = Boolean(authKey && authKey !== 'your_msg91_auth_key_here');
  const templateIdPresent = Boolean(templateId && templateId !== 'your_msg91_dlt_template_id_here');

  if (!isSimulator) {
    if (!authKeyPresent) {
      errors.push('MSG91_AUTH_KEY is required for live OTP dispatch. Set MSG91_AUTH_KEY in your environment or use "mock_developer_key" for local simulation.');
    }
    if (!templateIdPresent) {
      errors.push('MSG91_TEMPLATE_ID is required for live OTP dispatch. Please provide your DLT-approved MSG91 template ID.');
    }
  }

  return {
    isValid: errors.length === 0,
    isSimulator,
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
 * Production-ready MSG91 OTP Provider using MSG91 SendOTP v5 API.
 * Adheres strictly to the existing OtpProvider interface.
 */
export class Msg91OtpProvider implements OtpProvider {
  private readonly baseUrl = 'https://control.msg91.com/api/v5/otp';

  constructor() {
    // Validate environment upon instantiation and log actionable diagnostics
    const validation = validateMsg91Config();
    if (!validation.isValid && !validation.isSimulator) {
      console.warn(`[MSG91 Provider Configuration Warning] ${validation.errors.join(' | ')}`);
    } else if (validation.isSimulator) {
      console.log('[MSG91 Provider] Running in SIMULATOR mode (MSG91_AUTH_KEY is mock/unset). Real SMS will not be billed.');
    } else {
      console.log(`[MSG91 Provider] Initialized in PRODUCTION mode (Sender ID: ${validation.senderId}, Expiry: ${validation.otpExpiryMinutes}m).`);
    }
  }

  /**
   * Dispatches OTP via MSG91 SendOTP API v5.
   */
  async sendOtp(phoneNumber: string, rateLimitCount: number = 0): Promise<OtpResult> {
    const validation = validateMsg91Config();
    const normalizedMobile = normalizeMsg91Phone(phoneNumber);
    const masked = maskPhone(phoneNumber);

    // Development / Simulator fallback if auth key is not configured or set to mock
    if (validation.isSimulator) {
      console.log(`\n--- [MSG91 GATEWAY SIMULATOR] ---`);
      console.log(`Recipient: ${masked}`);
      console.log(`Template ID: ${process.env.MSG91_TEMPLATE_ID || 'SIMULATED_TEMPLATE'}`);
      console.log(`Sender ID: ${validation.senderId}`);
      console.log(`Expiry: ${validation.otpExpiryMinutes} minutes`);
      console.log(`Rate Count: ${rateLimitCount}`);
      console.log(`Status: Simulated OTP sent successfully.`);
      console.log(`---------------------------------\n`);

      return {
        success: true,
        message: 'Code sent successfully.',
        resendInSeconds: 30
      };
    }

    // If live mode is intended but required configuration is incomplete
    if (!validation.isValid) {
      console.error(`[MSG91 Provider] Send OTP blocked due to missing environment variables: ${validation.errors.join('; ')}`);
      return {
        success: false,
        message: "SMS OTP service is currently unconfigured. Please check server configuration."
      };
    }

    try {
      const authKey = process.env.MSG91_AUTH_KEY!;
      const templateId = process.env.MSG91_TEMPLATE_ID!;

      console.log(`[MSG91 Provider] Sending OTP to ${masked} (Expiry: ${validation.otpExpiryMinutes}m, Attempt: ${rateLimitCount})`);

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
        console.error(`[MSG91 Provider] Send OTP failed for ${masked}:`, errorMsg);
        return {
          success: false,
          message: "We couldn't send your verification code right now. Please try again."
        };
      }

      console.log(`[MSG91 Provider] OTP successfully dispatched to ${masked}. Message: ${data.message || 'Success'}`);

      return {
        success: true,
        message: 'Code sent successfully.',
        resendInSeconds: 30
      };
    } catch (err: any) {
      console.error(`[MSG91 Provider] Network or execution error sending OTP to ${masked}:`, err.message);
      return {
        success: false,
        message: 'A connection issue occurred while sending your code. Please try again.'
      };
    }
  }

  /**
   * Verifies OTP via MSG91 Verify OTP API v5.
   */
  async verifyOtp(phoneNumber: string, code: string): Promise<OtpVerifyResult> {
    const validation = validateMsg91Config();
    const normalizedMobile = normalizeMsg91Phone(phoneNumber);
    const masked = maskPhone(phoneNumber);

    // Development / Simulator verification
    if (validation.isSimulator) {
      console.log(`[MSG91 Gateway Simulator] Verifying code for ${masked}`);
      // In simulator mode, accepting any valid 6-digit numeric OTP for frictionless testing
      if (/^\d{6}$/.test(code)) {
        console.log(`[MSG91 Gateway Simulator] Code verified successfully for ${masked}`);
        return {
          success: true,
          message: 'Verified successfully.'
        };
      } else {
        return {
          success: false,
          message: "That code didn't match. Try again.",
          code: 'AUTH_OTP_MISMATCH'
        };
      }
    }

    if (!validation.isValid) {
      console.error(`[MSG91 Provider] Verify OTP blocked due to missing environment variables: ${validation.errors.join('; ')}`);
      return {
        success: false,
        message: "SMS OTP service is currently unconfigured. Please check server configuration.",
        code: 'CONFIG_ERROR'
      };
    }

    try {
      const authKey = process.env.MSG91_AUTH_KEY!;
      console.log(`[MSG91 Provider] Verifying OTP for ${masked}`);

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
        console.log(`[MSG91 Provider] OTP verified successfully for ${masked}`);
        return {
          success: true,
          message: 'Verified successfully.'
        };
      }

      // Handle MSG91 error states
      const rawMessage = (data.message || '').toLowerCase();
      console.warn(`[MSG91 Provider] Verification failed for ${masked}. Response:`, data.message || response.statusText);

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
        message: "That code didn't match. Try again.",
        code: 'AUTH_OTP_MISMATCH'
      };
    } catch (err: any) {
      console.error(`[MSG91 Provider] Verification network error for ${masked}:`, err.message);
      return {
        success: false,
        message: 'An unexpected verification error occurred. Please try again.',
        code: 'NETWORK_ISSUE'
      };
    }
  }
}
