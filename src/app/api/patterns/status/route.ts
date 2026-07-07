import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { PatternIntelligenceService } from '../../../../lib/patterns/patternIntelligenceService';

/**
 * GET /api/patterns/status
 *
 * Lightweight polling endpoint that returns the current user state for the
 * Pattern Engine. Called by the frontend every few seconds while the user is
 * in the 'backfill_pending' state to detect when backfill finishes.
 *
 * Response shape:
 *   { state: 'new_user' | 'backfill_pending' | 'active', snapshotsCount: number, backfillCompleted: boolean }
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const userId = authUser.userId;

    const userState = await PatternIntelligenceService.determinePatternUserState(userId);

    return NextResponse.json({
      success: true,
      state: userState.state,
      backfillCompleted: userState.backfillCompleted,
      hasSnapshots: userState.hasSnapshots
    }, {
      // Never cache this — it must always reflect the live DB state.
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('[API Patterns Status GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
