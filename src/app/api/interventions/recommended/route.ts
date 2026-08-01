import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { interventionEngine } from '../../../../lib/interventions/engine/intervention-engine';

/**
 * GET /api/interventions/recommended
 * Returns deterministic, rule-based intervention recommendations for the authenticated user.
 * STRICT GUARANTEE: ZERO AI / ZERO LLM / ZERO QUEUE JOBS.
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

    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 5;
    const isCrisis = request.nextUrl.searchParams.get('isCrisis') === 'true';
    const postJournal = request.nextUrl.searchParams.get('postJournal') === 'true' || request.nextUrl.searchParams.has('isCrisis');

    if (postJournal) {
      const postJournalData = await interventionEngine.getPostJournalRecommendations(userId, isCrisis);
      return NextResponse.json({
        success: true,
        data: postJournalData,
      });
    }

    const recommendations = await interventionEngine.getRecommendations(userId, limit);

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('GET /api/interventions/recommended error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
