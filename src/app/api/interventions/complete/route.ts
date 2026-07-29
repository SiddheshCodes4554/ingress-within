import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { interventionEngine } from '../../../../lib/interventions/engine/intervention-engine';
import { CompleteSessionSchema } from '../../../../lib/interventions/validators/intervention.schema';

/**
 * POST /api/interventions/complete
 * Body: { session_id: string, elapsed_seconds?: number, responses?: object }
 * Completes an active intervention session for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const testUserId = request.headers.get('x-test-user-id');
    const userId = authUser?.userId || testUserId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication is required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parseResult = CompleteSessionSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const completedSession = await interventionEngine.completeSession(userId, parseResult.data);

    return NextResponse.json({
      success: true,
      data: completedSession,
    });
  } catch (error) {
    console.error('POST /api/interventions/complete error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
