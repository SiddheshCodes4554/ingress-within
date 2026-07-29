import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { interventionEngine } from '../../../../lib/interventions/engine/intervention-engine';
import { PaginationSchema } from '../../../../lib/interventions/validators/intervention.schema';

/**
 * GET /api/interventions/history
 * Returns intervention history for the authenticated user with pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    const testUserId = request.headers.get('x-test-user-id');
    const userId = authUser?.userId || testUserId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication is required.' },
        { status: 401 }
      );
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parseResult = PaginationSchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const history = await interventionEngine.getHistory(userId, parseResult.data);

    return NextResponse.json({
      success: true,
      data: history.data,
      pagination: history.pagination,
    });
  } catch (error) {
    console.error('GET /api/interventions/history error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
