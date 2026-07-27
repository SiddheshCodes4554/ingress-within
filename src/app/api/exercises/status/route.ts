import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseRepository } from '../../../../lib/exercises/v4/repository/exerciseRepository';
import { ExerciseInstance } from '../../../../lib/exercises/v4/types/exercise.types';
import { Exercise2Service } from '../../../../lib/exercises/v4/services/exercise2Service';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const instanceId = request.nextUrl.searchParams.get('instance_id');
    const exerciseId = request.nextUrl.searchParams.get('exercise_id');
    const cycleId = request.nextUrl.searchParams.get('cycle_id') || undefined;

    // Handle Exercise 2 isolated status check
    if (exerciseId === 'exercise_2' || exerciseId === 'inkblot_projective') {
      const currentDay = Number(request.nextUrl.searchParams.get('current_day')) || 16;
      const currentCycle = Number(request.nextUrl.searchParams.get('current_cycle')) || 1;
      const status = await Exercise2Service.getStatus(authUser.userId, currentDay, currentCycle);
      const instance = await Exercise2Service.getCurrentInstance(authUser.userId);
      return NextResponse.json({ status, instance });
    }

    let instance: ExerciseInstance | null = null;
    if (instanceId) {
      instance = await ExerciseRepository.getInstance(instanceId);
    } else if (exerciseId) {
      instance = await ExerciseRepository.getInstanceByUserAndExercise(authUser.userId, cycleId, exerciseId);
    }

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

    return NextResponse.json({
      status: instance.status,
      unlock_time: instance.unlock_time,
      started_at: instance.started_at,
      submitted_at: instance.submitted_at,
      completed_at: instance.completed_at,
      instance
    });
  } catch (error: any) {
    console.error('[GET /api/exercises/status] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch exercise status.' } },
      { status: 500 }
    );
  }
}
