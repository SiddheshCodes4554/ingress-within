import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth-helper';
import { PatternIntelligenceService } from '../../../lib/patterns/patternIntelligenceService';

/**
 * GET /api/patterns: Fetches all patterns and their cycle states for the user.
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

    const overview = await PatternIntelligenceService.getPatternOverview(userId);

    return NextResponse.json({
      success: true,
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

