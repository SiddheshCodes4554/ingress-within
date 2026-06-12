import { NextRequest } from 'next/server';
import { supabase } from './db';
import { verifyJwt } from '../utils/crypto';
import { COOKIE_ACCESS_NAME } from '../utils/cookies';

export interface AuthenticatedUser {
  userId: string;
  phoneNumber: string;
  deviceId: string;
}

/**
 * Extracts and verifies the access token from cookies or Authorization header.
 * Validates against the active sessions table in Supabase.
 * Returns the user session metadata if valid, or null otherwise.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    let token = request.cookies?.get(COOKIE_ACCESS_NAME)?.value;
    
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(new RegExp(`${COOKIE_ACCESS_NAME}=([^;]+)`));
      if (match) token = match[1];
    }
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return null;

    const jwtSecret = process.env.JWT_SECRET || 'jwt_default_secret_dev';
    const payload = verifyJwt(token, jwtSecret);

    if (!payload || !payload.uid) return null;

    // Validate that the session is still active in database (revocable access tokens)
    const { data: sessions, error: sessionError } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', payload.uid)
      .eq('device_id', payload.did)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false });

    if (sessionError || !sessions || sessions.length === 0) return null;
    const session = sessions[0];

    return {
      userId: payload.uid,
      phoneNumber: payload.phone,
      deviceId: payload.did
    };
  } catch (error) {
    console.error('getAuthenticatedUser helper error:', error);
    return null;
  }
}
