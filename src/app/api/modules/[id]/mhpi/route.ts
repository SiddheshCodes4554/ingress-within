import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { ModuleProgressService } from '../../../../../lib/modules/moduleProgressService';

/**
 * POST /api/modules/[id]/mhpi
 * Persists baseline, weekly, or end MHPI responses for the authenticated user.
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

    const { assessment_type, week_number, responses, severity_score, improvement_pct } = body;

    if (!assessment_type || !responses) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'assessment_type and responses are required.' } },
        { status: 400 }
      );
    }

    const result = await ModuleProgressService.saveMhpiResponse(
      authUser.userId,
      id,
      assessment_type,
      responses,
      severity_score,
      week_number,
      improvement_pct
    );

    return NextResponse.json({
      success: true,
      user_id: authUser.userId,
      module_id: id,
      record: result.record
    });
  } catch (error: any) {
    console.error('[API /api/modules/[id]/mhpi POST] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to save MHPI response.' } },
      { status: 500 }
    );
  }
}
