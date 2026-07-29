import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { interventionEngine } from '../../../../../lib/interventions/engine/intervention-engine';

/**
 * POST /api/interventions/session/start
 * Body: { intervention_id: string }
 * Starts a new session or returns existing active session.
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
    if (!body || (!body.intervention_id && !body.interventionId)) {
      return NextResponse.json({ success: false, error: 'intervention_id is required' }, { status: 400 });
    }

    const interventionId = body.intervention_id || body.interventionId;
    const sessionData = await interventionEngine.startSession(userId, { intervention_id: interventionId });

    return NextResponse.json({
      success: true,
      data: sessionData,
    });
  } catch (error) {
    console.error('POST /api/interventions/session/start error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
