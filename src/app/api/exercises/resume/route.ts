import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseRepository } from '../../../../lib/exercises/v4/repository/exerciseRepository';

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
    const { instance_id } = body;

    if (!instance_id) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Must provide instance_id.' } },
        { status: 400 }
      );
    }

    const instance = await ExerciseRepository.getInstance(instance_id);
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

    if (!['started', 'in_progress', 'analysing', 'available'].includes(instance.status)) {
      return NextResponse.json(
        { error: { code: 'INVALID_STATE', message: `Cannot resume exercise in status "${instance.status}".` } },
        { status: 400 }
      );
    }

    const responses = await ExerciseRepository.getResponsesForInstance(instance_id);
    return NextResponse.json({ instance, responses });
  } catch (error: any) {
    console.error('[POST /api/exercises/resume] Error:', error);
    return NextResponse.json(
      { error: { code: 'RESUME_FAILED', message: error.message || 'Failed to resume exercise.' } },
      { status: 400 }
    );
  }
}
