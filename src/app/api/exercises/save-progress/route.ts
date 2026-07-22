import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseProgressService } from '../../../../lib/exercises/exerciseProgressService';

/**
 * POST: Saves user intermediate answers/responses during an exercise.
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
    const { instanceId, questionId, stepId, response, metadata } = body;

    if (!instanceId || !questionId || !stepId || response === undefined) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing required parameters: instanceId, questionId, stepId, and response.' } },
        { status: 400 }
      );
    }

    await ExerciseProgressService.saveProgress(
      authUser.userId,
      instanceId,
      questionId,
      stepId,
      response,
      metadata || {}
    );

    return NextResponse.json({
      success: true,
      message: 'Progress saved successfully.'
    });
  } catch (err: any) {
    console.error('[API save progress] Error:', err.message);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
