import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ModuleRecommendationService } from '../../../../lib/modules/moduleRecommendationService';

/**
 * POST /api/modules/recommended
 * Generates or retrieves an existing idempotent recommendation for the user's monthly cycle.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cycleId, topPatterns } = body;

    if (!cycleId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'cycleId is required.' } },
        { status: 400 }
      );
    }

    const patterns = Array.isArray(topPatterns) ? topPatterns : [];

    const response = await ModuleRecommendationService.getOrGenerateRecommendation(
      authUser.userId,
      cycleId,
      patterns
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[API /api/modules/recommended POST] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to process recommendation.' } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/modules/recommended?cycleId=...
 * Fetches existing recommendation for a cycle without re-generating.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycleId') || 'latest';

    const response = await ModuleRecommendationService.getOrGenerateRecommendation(
      authUser.userId,
      cycleId,
      [] // Empty patterns forces retrieval of existing recommendation
    );

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[API /api/modules/recommended GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch recommendation.' } },
      { status: 500 }
    );
  }
}
