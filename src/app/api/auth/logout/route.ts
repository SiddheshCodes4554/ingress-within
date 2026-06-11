import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { hashOtp } from '../../../../utils/crypto';

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

    if (refreshToken) {
      const tokenHash = hashOtp(refreshToken, 'session_salt_static_secret');
      
      // Fetch session to obtain user_id for logging
      const { data: sessionData } = await supabase
        .from('user_sessions')
        .select('user_id')
        .eq('refresh_token_hash', tokenHash)
        .maybeSingle();

      const userId = sessionData?.user_id || null;

      // Deactivate session in database
      const nowStr = new Date().toISOString();
      await supabase
        .from('user_sessions')
        .update({ is_active: false, expires_at: nowStr })
        .eq('refresh_token_hash', tokenHash);

      // Write security audit log
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'auth.logout_success',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: { logged_out_at: nowStr }
      });
    }

    // Assemble response and clear secure cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.'
    });

    response.cookies.set('__Host-iw-access', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0
    });

    response.cookies.set('__Host-iw-refresh', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error('Logout Route Error:', error);
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
