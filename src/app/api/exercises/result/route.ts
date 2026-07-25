import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseRepository } from '../../../../lib/exercises/v4/repository/exerciseRepository';
import { ExerciseResultService } from '../../../../lib/exercises/v4/services/exerciseResultService';

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
    if (!instanceId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Must provide instance_id.' } },
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

    const result = await ExerciseResultService.getResult(instanceId);
    return NextResponse.json({ success: true, result, instance });
  } catch (error: any) {
    console.error('[GET /api/exercises/result] Error:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: error.message || 'Internal error.' } },
      { status: 500 }
    );
  }
}
