import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../../lib/rate-limit';
import { getOtpProvider } from '../../../../providers/otpProvider';

export async function POST(request: Request) {
  try {
    // 1. Parse payload
    const body = await request.json().catch(() => ({}));
    const { phone_number } = body;

    // 2. Validate phone formatting (E.164 with +91 Indian prefix and 10 digits)
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phone_number || !phoneRegex.test(phone_number)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PHONE_NUMBER',
            message: "That doesn't look like a valid number."
          }
        },
        { status: 400 }
      );
    }

    // 3. Rate Limit Check (IP-based and Phone-based)
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = await checkRateLimit(phone_number, ipAddress);
    
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
    const result = await provider.sendOtp(phone_number, rateLimit.count + 1);

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
    console.error('Send OTP Route Error:', error);
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
