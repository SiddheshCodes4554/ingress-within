import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { verifyJwt } from '../../../../utils/crypto';
import { COOKIE_ACCESS_NAME } from '../../../../utils/cookies';

export async function GET(request: NextRequest) {
  try {
    if (request.cookies && typeof request.cookies.getAll === 'function') {
      console.log('[me/route.ts] Incoming request cookies:', request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 10)}...`));
    } else {
      console.log('[me/route.ts] Incoming request cookies: none or cookies helper not available');
    }
    
    // 1. Resolve access token (priority to secure cookie, fallback to Authorization header)
    let token = request.cookies?.get(COOKIE_ACCESS_NAME)?.value;
    console.log(`[me/route.ts] Cookie resolved token (name=${COOKIE_ACCESS_NAME}):`, token ? `${token.substring(0, 15)}...` : 'not found');
    
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(new RegExp(`${COOKIE_ACCESS_NAME}=([^;]+)`));
      if (match) {
        token = match[1];
        console.log(`[me/route.ts] Regex header resolved token (name=${COOKIE_ACCESS_NAME}):`, `${token.substring(0, 15)}...`);
      }
    }
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.substring(7);
        console.log('[me/route.ts] Authorization header resolved token:', `${token.substring(0, 15)}...`);
      }
    }

    if (!token) {
      console.warn('[me/route.ts] Authentication failed: No access token found in request.');
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
      console.warn('[me/route.ts] Authentication failed: JWT payload verification failed or uid missing.');
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
    console.log('[me/route.ts] Verified JWT payload:', { uid: payload.uid, phone: payload.phone, did: payload.did });

    // 3. Validate that the session is still active in database (revocable access tokens)
    console.log('[me/route.ts] Querying user_sessions table in Supabase for user_id:', payload.uid, 'and device_id:', payload.did);
    const { data: sessions, error: sessionError } = await supabase
      .from('user_sessions')
      .select('id, expires_at, is_active')
      .eq('user_id', payload.uid)
      .eq('device_id', payload.did)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false });

    let session: any = null;
    if (sessions && sessions.length > 0) {
      if (sessions.length > 1) {
        console.warn(`[me/route.ts] MULTIPLE ACTIVE SESSIONS DETECTED! Count: ${sessions.length}, User ID: ${payload.uid}, Device ID: ${payload.did}. Stale sessions will be deactivated.`);
        console.warn(`Active Session IDs:`, sessions.map(s => s.id));
        
        // Asynchronously deactivate the older sessions in the background
        const staleSessionIds = sessions.slice(1).map(s => s.id);
        supabase
          .from('user_sessions')
          .update({ is_active: false })
          .in('id', staleSessionIds)
          .then(({ error: cleanError }) => {
            if (cleanError) {
              console.error(`[me/route.ts] Background cleanup of stale sessions failed:`, cleanError.message);
            } else {
              console.log(`[me/route.ts] Background cleanup successfully deactivated stale sessions:`, staleSessionIds);
            }
          });
      }
      session = sessions[0];
    }

    if (sessionError) {
      console.error('[me/route.ts] Supabase query error checking user sessions:', sessionError);
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to query session table.'
          }
        },
        { status: 500 }
      );
    }

    if (!session) {
      console.warn('[me/route.ts] Authentication failed: No active session row found in database for this user/device.');
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
    console.log('[me/route.ts] Active session found in database:', session.id, 'expires_at:', session.expires_at);

    // 4. Fetch active user from database
    console.log('[me/route.ts] Querying users table for id:', payload.uid);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, phone_number, name, is_active, created_at')
      .eq('id', payload.uid)
      .eq('is_active', true)
      .maybeSingle();

    if (userError) {
      console.error('[me/route.ts] Supabase query error fetching user:', userError);
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to retrieve user record.'
          }
        },
        { status: 500 }
      );
    }

    if (!user) {
      console.warn('[me/route.ts] Authentication failed: User account not found or deactivated for id:', payload.uid);
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
    console.log('[me/route.ts] User record found:', { id: user.id, phone: user.phone_number });

    // 5. Fetch user profile and onboarding flags
    console.log('[me/route.ts] Querying profiles table for id:', payload.uid);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', payload.uid)
      .maybeSingle();

    if (profileError) {
      console.error('[me/route.ts] Failed to query user profile:', profileError);
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to retrieve user profile.'
          }
        },
        { status: 500 }
      );
    }

    let profileRecord = profile;
    if (!profile) {
      console.log('[me/route.ts] Profile not found. Triggering dynamic backfill...');
      // Dynamic backfill to prevent gaps for pre-existing users
      const { data: newProfile, error: backfillError } = await supabase
        .from('profiles')
        .insert({ id: user.id, phone_number: user.phone_number })
        .select()
        .maybeSingle();

      if (backfillError) {
        console.error('[me/route.ts] Failed to backfill user profile:', backfillError);
        return NextResponse.json(
          {
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to initialize user profile.'
            }
          },
          { status: 500 }
        );
      }

      if (newProfile) {
        profileRecord = newProfile;
        console.log('[me/route.ts] Dynamic backfill profile created successfully:', newProfile);
      } else {
        console.warn('[me/route.ts] Dynamic backfill returned empty profile.');
      }
    } else {
      console.log('[me/route.ts] User profile found:', {
        id: profile.id,
        consent_completed: profile.consent_completed,
        profile_completed: profile.profile_completed,
        onboarding_completed: profile.onboarding_completed
      });
    }

    // 6. Return user profile and onboarding state
    console.log('[me/route.ts] Successful check user response returning user & profile');
    return NextResponse.json({
      success: true,
      user,
      profile: profileRecord
    });

  } catch (error) {
    console.error('[me/route.ts] Critical error in me endpoint:', error);
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
