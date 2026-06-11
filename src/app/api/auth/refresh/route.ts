import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { hashOtp, generateToken, signJwt } from '../../../../utils/crypto';

export async function POST(request: NextRequest) {
  try {
    let refreshToken = request.cookies?.get('__Host-iw-refresh')?.value;
    
    if (!refreshToken) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/__Host-iw-refresh=([^;]+)/);
      if (match) refreshToken = match[1];
    }
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_SESSION_EXPIRED',
            message: 'Your session has expired. Please log in again.'
          }
        },
        { status: 401 }
      );
    }

    const tokenHash = hashOtp(refreshToken, 'session_salt_static_secret');
    const nowStr = new Date().toISOString();

    // 1. Fetch active session matching refresh token
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('refresh_token_hash', tokenHash)
      .eq('is_active', true)
      .gt('expires_at', nowStr)
      .maybeSingle();

    if (sessionError || !session) {
      // Security measure: Clear invalid/compromised cookies
      const response = NextResponse.json(
        {
          error: {
            code: 'AUTH_SESSION_EXPIRED',
            message: 'Your session has expired. Please log in again.'
          }
        },
        { status: 401 }
      );
      
      response.cookies.set('__Host-iw-access', '', { maxAge: 0, path: '/' });
      response.cookies.set('__Host-iw-refresh', '', { maxAge: 0, path: '/' });
      return response;
    }

    // 2. Fetch associated user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user_id)
      .eq('is_active', true)
      .maybeSingle();

    if (userError || !user) {
      const response = NextResponse.json(
        {
          error: {
            code: 'AUTH_USER_DISABLED',
            message: 'This user account has been disabled.'
          }
        },
        { status: 401 }
      );
      
      response.cookies.set('__Host-iw-access', '', { maxAge: 0, path: '/' });
      response.cookies.set('__Host-iw-refresh', '', { maxAge: 0, path: '/' });
      return response;
    }

    // 3. Generate rotated credentials
    const newRawRefreshToken = generateToken();
    const newHashedRefreshToken = hashOtp(newRawRefreshToken, 'session_salt_static_secret');
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    // 4. Update session table with rotated token
    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({
        refresh_token_hash: newHashedRefreshToken,
        expires_at: newExpiresAt,
        last_active_at: nowStr,
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Failed to rotate session credentials:', updateError);
      return NextResponse.json(
        {
          error: {
            code: 'SERVER_ERROR',
            message: 'An unexpected database error occurred.'
          }
        },
        { status: 500 }
      );
    }

    // 5. Sign new JWT Access Token
    const jwtSecret = process.env.JWT_SECRET || 'jwt_default_secret_dev';
    const accessToken = signJwt(
      {
        uid: user.id,
        phone: user.phone_number,
        did: session.device_id
      },
      jwtSecret,
      15 * 60 // 15 minutes
    );

    // 6. Write Audit Log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'auth.token_refresh',
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: { device_id: session.device_id }
    });

    // 7. Assemble response and write rotated cookies
    const response = NextResponse.json({
      success: true,
      session: {
        access_token: accessToken,
        expires_in: 15 * 60
      }
    });

    response.cookies.set('__Host-iw-access', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60
    });

    response.cookies.set('__Host-iw-refresh', newRawRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60
    });

    return response;

  } catch (error) {
    console.error('Refresh Route Error:', error);
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
