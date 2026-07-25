import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth-helper';
import { ExerciseRepository } from '../../../lib/exercises/v4/repository/exerciseRepository';
import { ExerciseLifecycleStatus } from '../../../lib/exercises/v4/types/exercise.types';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const cycleId = request.nextUrl.searchParams.get('cycle_id') || undefined;
    const statusParam = request.nextUrl.searchParams.get('status') as ExerciseLifecycleStatus | null;

    let instances = await ExerciseRepository.getUserInstances(authUser.userId, cycleId);

    if (statusParam) {
      instances = instances.filter(i => i.status === statusParam);
    }

    return NextResponse.json({ instances });
  } catch (error: any) {
    console.error('[GET /api/exercises] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch exercises.' } },
      { status: 500 }
    );
  }
}
