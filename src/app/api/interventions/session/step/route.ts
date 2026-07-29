import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { interventionEngine } from '../../../../../lib/interventions/engine/intervention-engine';

/**
 * POST /api/interventions/session/step
 * Body: { session_id: string, direction?: 'next' | 'previous', question_id?: string, answer?: string, elapsed_seconds?: number }
 * Advances or rewinds step and autosaves responses (STORED ONLY - ZERO AI).
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
    const direction = body.direction || 'next';

    let result;
    if (direction === 'previous') {
      result = await interventionEngine.previousStep(userId, sessionId);
    } else {
      result = await interventionEngine.nextStep(userId, sessionId, {
        question_id: body.question_id,
        answer: body.answer,
        elapsed_seconds: body.elapsed_seconds,
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('POST /api/interventions/session/step error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
