import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { ModuleProgressService } from '../../../../../lib/modules/moduleProgressService';

/**
 * POST /api/modules/[id]/answers
 * Autosaves user answer for a specific touch & step for the authenticated user.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const { touch_id, step_key, answer_data } = body;

    if (!touch_id || !step_key || !answer_data) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'touch_id, step_key, and answer_data are required.' } },
        { status: 400 }
      );
    }

    const result = await ModuleProgressService.saveAnswer(
      authUser.userId,
      id,
      touch_id,
      step_key,
      answer_data
    );

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: result.error || 'Failed to save answer.' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user_id: authUser.userId,
      module_id: id,
      touch_id,
      step_key
    });
  } catch (error: any) {
    console.error('[API /api/modules/[id]/answers POST] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to save answer.' } },
      { status: 500 }
    );
  }
}
