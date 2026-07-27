import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseRepository } from '../../../../lib/exercises/v4/repository/exerciseRepository';

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
    const cycleId = request.nextUrl.searchParams.get('cycle_id') || undefined;

    // If specific instance_id requested, fetch THAT EXACT instance
    if (instanceId) {
      const targetInstance = await ExerciseRepository.getInstance(instanceId);
      if (!targetInstance || targetInstance.user_id !== authUser.userId) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Exercise instance not found.' } },
          { status: 404 }
        );
      }
      const responses = await ExerciseRepository.getResponsesForInstance(instanceId);
      return NextResponse.json({ instance: targetInstance, responses });
    }

    const rawInstances = await ExerciseRepository.getUserInstances(authUser.userId, cycleId);
    // Sort instances by updated_at descending to get the most recent active exercise
    const instances = [...rawInstances].sort((a, b) => {
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });

    // Prioritize in_progress -> started -> available
    const currentInstance =
      instances.find(i => i.status === 'in_progress') ||
      instances.find(i => i.status === 'started') ||
      instances.find(i => i.status === 'available') ||
      null;

    if (!currentInstance) {
      return NextResponse.json({ instance: null, responses: [] });
    }

    const responses = await ExerciseRepository.getResponsesForInstance(currentInstance.id);
    return NextResponse.json({ instance: currentInstance, responses });
  } catch (error: any) {
    console.error('[GET /api/exercises/current] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch current exercise.' } },
      { status: 500 }
    );
  }
}
