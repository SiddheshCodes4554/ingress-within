import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../../../lib/auth-helper';
import { ModuleProgressService } from '../../../../../../../lib/modules/moduleProgressService';

/**
 * POST /api/modules/[id]/touches/[touchId]/complete
 * Validates and records touch completion for the authenticated user.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; touchId: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { id, touchId } = await params;

    if (!id || !touchId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Module ID and Touch ID are required.' } },
        { status: 400 }
      );
    }

    const result = await ModuleProgressService.recordTouchCompletion(authUser.userId, id, touchId);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: result.error || 'Failed to complete touch.' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user_id: authUser.userId,
      module_id: id,
      touch_id: touchId,
      completedTouches: result.completedTouches
    });
  } catch (error: any) {
    console.error('[API /api/modules/[id]/touches/[touchId]/complete POST] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to record touch completion.' } },
      { status: 500 }
    );
  }
}
