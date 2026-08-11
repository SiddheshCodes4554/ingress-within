import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { ModuleProgressService } from '../../../../../lib/modules/moduleProgressService';

/**
 * GET /api/modules/[id]/progress
 * Returns full persisted module progress state for the authenticated user.
 */
export async function GET(
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
    if (!id) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Module ID is required.' } },
        { status: 400 }
      );
    }

    const state = await ModuleProgressService.getFullUserModuleState(authUser.userId, id);

    return NextResponse.json({
      success: true,
      user_id: authUser.userId,
      module_id: id,
      state
    });
  } catch (error: any) {
    console.error('[API /api/modules/[id]/progress GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch module progress.' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/modules/[id]/progress
 * Updates user's module progress (status, current_week, current_touch_id).
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

    const progress = await ModuleProgressService.updateProgress(authUser.userId, id, {
      status: body.status,
      current_week: body.current_week,
      current_touch_id: body.current_touch_id,
      completed_at: body.completed_at
    });

    return NextResponse.json({
      success: true,
      progress
    });
  } catch (error: any) {
    console.error('[API /api/modules/[id]/progress POST] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to update module progress.' } },
      { status: 500 }
    );
  }
}
