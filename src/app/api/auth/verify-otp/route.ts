import { NextRequest, NextResponse } from 'next/server';
import { getOtpProvider } from '../../../../providers/otpProvider';
import { AuthService } from '../../../../services/authService';
import { supabase } from '../../../../lib/db';
import { COOKIE_ACCESS_NAME, COOKIE_REFRESH_NAME, getCookieOptions } from '../../../../utils/cookies';

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

    // Fetch user profile and onboarding flags to determine next routing destination
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionResult.user.id)
      .maybeSingle();

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
      profile: profile || null,
      session: {
        access_token: sessionResult.accessToken,
        expires_in: sessionResult.expiresIn
      }
    });

    // Set secure cookies
    response.cookies.set(COOKIE_ACCESS_NAME, sessionResult.accessToken, getCookieOptions(sessionResult.expiresIn));
    response.cookies.set(COOKIE_REFRESH_NAME, sessionResult.refreshToken, getCookieOptions(30 * 24 * 60 * 60));

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
