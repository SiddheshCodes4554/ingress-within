import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { interventionEngine } from '../../../../lib/interventions/engine/intervention-engine';
import { FavoriteSchema } from '../../../../lib/interventions/validators/intervention.schema';

/**
 * POST /api/interventions/favorite
 * Body: { intervention_id: string, action?: 'favorite' | 'unfavorite' | 'toggle' }
 * Manages favorites for the authenticated user.
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
    const parseResult = FavoriteSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { intervention_id, action } = parseResult.data;

    let isFavorite = false;
    if (action === 'favorite') {
      await interventionEngine.favorite(userId, intervention_id);
      isFavorite = true;
    } else if (action === 'unfavorite') {
      await interventionEngine.unfavorite(userId, intervention_id);
      isFavorite = false;
    } else {
      const res = await interventionEngine.toggleFavorite(userId, intervention_id);
      isFavorite = res.is_favorite;
    }

    return NextResponse.json({
      success: true,
      data: {
        intervention_id,
        is_favorite: isFavorite,
      },
    });
  } catch (error) {
    console.error('POST /api/interventions/favorite error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
