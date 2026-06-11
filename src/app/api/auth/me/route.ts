import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { verifyJwt } from '../../../../utils/crypto';

export async function GET(request: NextRequest) {
  try {
    // 1. Resolve access token (priority to secure cookie, fallback to Authorization header)
    let token = request.cookies?.get('__Host-iw-access')?.value;
    
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/__Host-iw-access=([^;]+)/);
      if (match) token = match[1];
    }
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication token is required.'
          }
        },
        { status: 401 }
      );
    }

    // 2. Cryptographically verify JWT
    const jwtSecret = process.env.JWT_SECRET || 'jwt_default_secret_dev';
    const payload = verifyJwt(token, jwtSecret);

    if (!payload || !payload.uid) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_INVALID_TOKEN',
            message: 'Your login token is invalid or has expired.'
          }
        },
        { status: 401 }
      );
    }

    // 3. Validate that the session is still active in database (revocable access tokens)
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', payload.uid)
      .eq('device_id', payload.did)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_SESSION_EXPIRED',
            message: 'Your session has been logged out or expired.'
          }
        },
        { status: 401 }
      );
    }

    // 4. Fetch active user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, phone_number, name, is_active, created_at')
      .eq('id', payload.uid)
      .eq('is_active', true)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_USER_NOT_FOUND',
            message: 'User account not found or has been deactivated.'
          }
        },
        { status: 401 }
      );
    }

    // 4. Return user profile
    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Me Profile Route Error:', error);
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
