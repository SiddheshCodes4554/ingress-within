import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { ExerciseResultService } from '../../../../../lib/exercises/exerciseResultService';

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET: Fetches AI result analysis for a finished exercise instance via ExerciseResultService.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const { id: rawId } = await context.params;

    const payload = await ExerciseResultService.getResult(authUser.userId, rawId);

    return NextResponse.json({
      success: payload.success,
      result: payload.result || null,
      instanceStatus: payload.instanceStatus,
      isProcessing: payload.isProcessing || false,
      isFailed: payload.isFailed || false,
      isMissing: payload.isMissing || false,
      error: payload.error || null
    });
  } catch (err: any) {
    console.error('[API exercise result] Error:', err.message);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
