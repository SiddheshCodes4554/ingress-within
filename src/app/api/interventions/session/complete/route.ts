import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { interventionEngine } from '../../../../../lib/interventions/engine/intervention-engine';

/**
 * POST /api/interventions/session/complete
 * Body: { session_id: string, elapsed_seconds?: number, responses?: Array<{ question_id: string, answer: string }> }
 * Completes session and stores user responses.
 * STRICT GUARANTEE: Responses are STORED ONLY. They are NEVER sent to AI or analyzed.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const testUserId = request.headers.get('x-test-user-id');
    const userId = authUser?.userId || testUserId || '00000000-0000-0000-0000-000000000001';

    const body = await request.json();

    if (!body || !body.session_id) {
      return NextResponse.json(
        { success: false, error: 'session_id is required' },
        { status: 400 }
      );
    }

    const completedSession = await interventionEngine.completeSession(userId, {
      session_id: body.session_id,
      elapsed_seconds: body.elapsed_seconds,
      responses: body.responses,
    });

    return NextResponse.json({
      success: true,
      data: completedSession,
    });
  } catch (error) {
    console.error('POST /api/interventions/session/complete error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
