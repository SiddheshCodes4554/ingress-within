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

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);

    const instances = await ExerciseRepository.getUserInstances(authUser.userId);
    const historyInstances = instances
      .filter(i => ['submitted', 'processing', 'completed'].includes(i.status))
      .slice(offset, offset + limit);

    const history = await Promise.all(
      historyInstances.map(async instance => {
        const result = await ExerciseRepository.getResultForInstance(instance.id);
        return { instance, result };
      })
    );

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('[GET /api/exercises/history] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch exercise history.' } },
      { status: 500 }
    );
  }
}
