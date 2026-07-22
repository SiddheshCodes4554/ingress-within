import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseLifecycleManager } from '../../../../lib/exercises/exerciseLifecycleManager';

/**
 * POST: Transitions an available/locked exercise instance to 'started'.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { instanceId } = body;

    if (!instanceId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing instanceId in request body.' } },
        { status: 400 }
      );
    }

    const instance = await ExerciseLifecycleManager.transitionTo(authUser.userId, instanceId, 'started', {
      transitionReason: 'User clicked Start Exercise.'
    });

    return NextResponse.json({
      success: true,
      instance
    });
  } catch (err: any) {
    console.error('[API start exercise] Error:', err.message);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
