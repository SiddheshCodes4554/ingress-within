import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { interventionEngine } from '../../../../../lib/interventions/engine/intervention-engine';

/**
 * POST /api/interventions/session/pause
 * Body: { session_id: string, elapsed_seconds?: number }
 * Pauses session and saves elapsed practice time.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const testUserId = request.headers.get('x-test-user-id');
    const userId = authUser?.userId || testUserId;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    if (!body || (!body.session_id && !body.sessionId)) {
      return NextResponse.json({ success: false, error: 'session_id is required' }, { status: 400 });
    }

    const sessionId = body.session_id || body.sessionId;
    const pausedSession = await interventionEngine.pauseSession(userId, sessionId, body.elapsed_seconds);

    return NextResponse.json({
      success: true,
      data: pausedSession,
    });
  } catch (error) {
    console.error('POST /api/interventions/session/pause error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
