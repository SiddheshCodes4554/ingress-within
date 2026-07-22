import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseProgressService } from '../../../../lib/exercises/exerciseProgressService';

/**
 * POST: Resumes a partially completed exercise, returning saved answers.
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

    const { instance, responses, screenState, stimulusList } = await ExerciseProgressService.resumeExercise(authUser.userId, instanceId);

    return NextResponse.json({
      success: true,
      instance,
      responses,
      screenState,
      stimulusList
    });
  } catch (err: any) {
    console.error('[API resume exercise] Error:', err.message);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
