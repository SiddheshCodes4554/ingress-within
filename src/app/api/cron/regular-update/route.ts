import { NextRequest, NextResponse } from 'next/server';
import { runScheduledThreeDayUpdatesForActiveUsers, checkAndRefreshThreeDayIntelligence } from '../../../../lib/intelligence/periodicUpdater';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

/**
 * GET /api/cron/regular-update
 * Triggers 3-day recurring updates for emotional vocabulary and behavioral patterns.
 * Can be called by Vercel Cron, external cron schedulers, or directly by authenticated users.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'ingress_cron_secret_2026';
    const isCronAuthorized = authHeader === `Bearer ${cronSecret}` || request.headers.get('x-vercel-cron') === '1';

    if (isCronAuthorized) {
      const summary = await runScheduledThreeDayUpdatesForActiveUsers();
      return NextResponse.json({
        success: true,
        message: '3-Day regular update executed successfully for active users.',
        ...summary
      });
    }

    // If called directly by a logged-in user, refresh their individual 3-day intelligence
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication or valid cron secret required.' } },
        { status: 401 }
      );
    }

    const result = await checkAndRefreshThreeDayIntelligence(authUser.userId);
    return NextResponse.json({
      success: true,
      message: '3-Day intelligence check completed for user.',
      result
    });

  } catch (error: any) {
    console.error('[API Cron Regular Update GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Server error during 3-day update execution.' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
