import { NextRequest, NextResponse } from 'next/server';
import { getOtpProvider } from '../../../../providers/otpProvider';
import { AuthService } from '../../../../services/authService';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse payload
    const body = await request.json().catch(() => ({}));
    const { phone_number, otp_code, device_id, device_name } = body;

    // 2. Validate parameters
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

    if (!otp_code || !/^\d{6}$/.test(otp_code)) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_OTP_MISMATCH',
            message: "That code didn't match. Try again."
          }
        },
        { status: 400 }
      );
    }

    if (!device_id) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_DEVICE',
            message: 'Device fingerprint information is required.'
          }
        },
        { status: 400 }
      );
    }

    // 3. Verify OTP via configured provider
    const provider = getOtpProvider();
    const result = await provider.verifyOtp(phone_number, otp_code);

    if (!result.success) {
      const status = result.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 400;
      return NextResponse.json(
        {
          error: {
            code: result.code || 'AUTH_OTP_MISMATCH',
            message: result.message
          }
        },
        { status }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // 4. Establish Session using AuthService
    const sessionResult = await AuthService.establishSession(
      phone_number,
      device_id,
      device_name || 'Browser',
      ipAddress,
      userAgent,
      result.userId
    );

    // 5. Assemble response
    const response = NextResponse.json({
      success: true,
      user: {
        id: sessionResult.user.id,
        phone_number: sessionResult.user.phone_number,
        name: sessionResult.user.name,
        is_active: sessionResult.user.is_active,
        created_at: sessionResult.user.created_at
      },
      session: {
        access_token: sessionResult.accessToken,
        expires_in: sessionResult.expiresIn
      }
    });

    // Set secure cookies
    response.cookies.set('__Host-iw-access', sessionResult.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: sessionResult.expiresIn
    });

    response.cookies.set('__Host-iw-refresh', sessionResult.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60
    });

    return response;

  } catch (error) {
    console.error('Verify OTP Route Error:', error);
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
