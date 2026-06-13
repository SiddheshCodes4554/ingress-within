import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { checkRateLimit } from '../../../../../lib/rate-limit';
import { getOtpProvider } from '../../../../../providers/otpProvider';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required to perform this action.' } },
        { status: 401 }
      );
    }

    const { phoneNumber } = user;

    // 2. Validate phone formatting (E.164 with +91 Indian prefix and 10 digits)
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PHONE_NUMBER',
            message: "A valid phone number is required on your profile."
          }
        },
        { status: 400 }
      );
    }

    // 3. Rate Limit Check (IP-based and Phone-based)
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = await checkRateLimit(phoneNumber, ipAddress);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Please wait before requesting another code.'
          }
        },
        { status: 429 }
      );
    }

    // 4. Send OTP via configured provider
    const provider = getOtpProvider();
    const result = await provider.sendOtp(phoneNumber, rateLimit.count + 1);

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'NETWORK_ISSUE',
            message: result.message
          }
        },
        { status: 500 }
      );
    }

    // 5. Return success
    return NextResponse.json({
      success: true,
      message: result.message,
      resend_in_seconds: result.resendInSeconds || 30
    });

  } catch (error) {
    console.error('Send Delete OTP Route Error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected server error occurred.'
        }
      },
      { status: 500 }
    );
  }
}
