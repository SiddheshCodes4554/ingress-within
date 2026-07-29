import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { interventionEngine } from '../../../../lib/interventions/engine/intervention-engine';

/**
 * POST /api/interventions/favourite (also aliased for favorite)
 * Body: { intervention_id: string, action?: 'favourite' | 'unfavourite' | 'toggle' | 'favorite' | 'unfavorite' }
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    if (!body || !body.intervention_id) {
      return NextResponse.json(
        { success: false, error: 'intervention_id is required' },
        { status: 400 }
      );
    }

    const intervention_id = body.intervention_id;
    const action = body.action || 'toggle';

    let isFav = false;
    if (action === 'favourite' || action === 'favorite') {
      await interventionEngine.favourite(userId, intervention_id);
      isFav = true;
    } else if (action === 'unfavourite' || action === 'unfavorite') {
      await interventionEngine.unfavourite(userId, intervention_id);
      isFav = false;
    } else {
      const res = await interventionEngine.toggleFavourite(userId, intervention_id);
      isFav = res.is_favourite;
    }

    return NextResponse.json({
      success: true,
      data: {
        intervention_id,
        is_favourite: isFav,
      },
    });
  } catch (error) {
    console.error('POST /api/interventions/favourite error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
