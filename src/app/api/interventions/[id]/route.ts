import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { interventionEngine } from '../../../../lib/interventions/engine/intervention-engine';

/**
 * GET /api/interventions/:id
 * Fetches a single intervention by ID or slug.
 */
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Intervention ID or slug is required.' },
        { status: 400 }
      );
    }

    const authUser = await getAuthenticatedUser(request);
    const testUserId = request.headers.get('x-test-user-id');
    const userId = authUser?.userId || testUserId || undefined;

    const detail = await interventionEngine.getIntervention(id, userId);

    if (!detail) {
      return NextResponse.json(
        { success: false, error: `Intervention not found: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    console.error(`GET /api/interventions/[id] error:`, error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
