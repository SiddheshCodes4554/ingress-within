import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseRepository } from '../../../../lib/exercises/v4/repository/exerciseRepository';
import { ExerciseService } from '../../../../lib/exercises/v4/services/exerciseService';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    let instanceId = body.instance_id;

    if (!instanceId && body.exercise_id) {
      const found = await ExerciseRepository.getInstanceByUserAndExercise(authUser.userId, body.cycle_id, body.exercise_id);
      if (found) instanceId = found.id;
    }

    if (!instanceId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Must provide valid instance_id or exercise_id.' } },
        { status: 400 }
      );
    }

    const instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Exercise instance not found.' } },
        { status: 404 }
      );
    }

    if (instance.user_id !== authUser.userId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied.' } },
        { status: 403 }
      );
    }

    const startedInstance = await ExerciseService.startExercise(instanceId);
    return NextResponse.json({ success: true, instance: startedInstance });
  } catch (error: any) {
    console.error('[POST /api/exercises/start] Error:', error);
    return NextResponse.json(
      { error: { code: 'INVALID_TRANSITION', message: error.message || 'Failed to start exercise.' } },
      { status: 400 }
    );
  }
}
