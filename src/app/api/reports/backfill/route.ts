import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { backfillWeeklyReports } from '../../../../lib/weeklyReportBackfill';

/**
 * POST /api/reports/backfill: Manually triggers the backfill orchestrator to scan and backfill missing reports.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const userId = authUser.userId;

    // Run the backfill audit programmatically
    const backfillResult = await backfillWeeklyReports(userId);

    return NextResponse.json({
      success: true,
      backfill: backfillResult
    });

  } catch (error: any) {
    console.error('[API Reports Backfill POST] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
