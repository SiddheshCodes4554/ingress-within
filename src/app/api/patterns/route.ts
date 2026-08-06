import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth-helper';
import { PatternIntelligenceService } from '../../../lib/patterns/patternIntelligenceService';

/**
 * GET /api/patterns: Fetches all patterns and their cycle states for the user.
 * Returns both the pattern overview and the computed userState ('new_user' | 'backfill_pending' | 'active').
 * Reads compiled snapshots without AI generation on read.
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

    // Trigger non-blocking 3-day regular update check in background
    import('../../../lib/intelligence/periodicUpdater')
      .then(m => m.checkAndRefreshThreeDayIntelligence(userId))
      .catch(err => console.warn('[Patterns Route] Periodic check warning:', err.message));

    // Run state determination and overview fetch in parallel for speed.
    const [userState, overview] = await Promise.all([
      PatternIntelligenceService.determinePatternUserState(userId),
      PatternIntelligenceService.getPatternOverview(userId)
    ]);

    return NextResponse.json({
      success: true,
      userState,
      ...overview
    });

  } catch (error: any) {
    console.error('[API Patterns GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
