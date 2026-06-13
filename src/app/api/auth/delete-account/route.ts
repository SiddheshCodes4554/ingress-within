import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { getOtpProvider } from '../../../../providers/otpProvider';
import { COOKIE_ACCESS_NAME, COOKIE_REFRESH_NAME, getCookieOptions } from '../../../../utils/cookies';

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

    // 2. Parse payload
    const body = await request.json().catch(() => ({}));
    const { otp_code } = body;

    // 3. Validate OTP code
    if (!otp_code || !/^\d{6}$/.test(otp_code)) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_OTP_MISMATCH',
            message: "Please enter a valid 6-digit verification code."
          }
        },
        { status: 400 }
      );
    }

    // 4. Verify OTP via configured provider
    const provider = getOtpProvider();
    const result = await provider.verifyOtp(user.phoneNumber, otp_code);

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

    // 5. Success - Wipe all user data from Supabase
    
    // Deleting audit logs for the user to leave no trace
    await supabase
      .from('audit_logs')
      .delete()
      .eq('user_id', user.userId);

    // Deleting OTP verifications for this phone number to leave no trace
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('phone_number', user.phoneNumber);

    // Deleting primary user record - ON DELETE CASCADE will automatically wipe profiles, user_sessions, consents, notification_preferences
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.userId);

    if (deleteError) {
      console.error('Failed to permanently delete user record:', deleteError);
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to delete user records from the database.'
          }
        },
        { status: 500 }
      );
    }

    // 6. Build response and clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Account and all associated records permanently deleted.'
    });

    response.cookies.set(COOKIE_ACCESS_NAME, '', getCookieOptions(0));
    response.cookies.set(COOKIE_REFRESH_NAME, '', getCookieOptions(0));

    return response;

  } catch (error) {
    console.error('Delete Account Route Error:', error);
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
