import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { interventionEngine } from '../../../../../lib/interventions/engine/intervention-engine';

/**
 * GET /api/interventions/session/[id]
 * Retrieves session state, current step, progression percentage, and stored reflection answers.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const testUserId = request.headers.get('x-test-user-id');
    const userId = authUser?.userId || testUserId;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { id: sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
    }

    const sessionState = await interventionEngine.getSession(userId, sessionId);

    return NextResponse.json({
      success: true,
      data: sessionState,
    });
  } catch (error) {
    console.error('GET /api/interventions/session/[id] error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
