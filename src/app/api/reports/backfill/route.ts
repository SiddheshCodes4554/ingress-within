import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { backfillWeeklyReports } from '../../../../lib/weeklyReportBackfill';
import { supabase } from '../../../../lib/db';

/**
 * POST /api/reports/backfill: Manually triggers the backfill orchestrator to scan and backfill missing reports.
 * Supports ?all=true query parameter to scan and regenerate for all users.
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

    const { searchParams } = new URL(request.url);
    const allUsers = searchParams.get('all') === 'true';

    if (allUsers) {
      console.log(`[API Reports Backfill] Triggered backfill for all users`);
      const { data: users, error: usersErr } = await supabase
        .from('users')
        .select('id');

      if (usersErr) {
        throw new Error(`Failed to fetch users: ${usersErr.message}`);
      }

      const results: any[] = [];
      for (const u of users || []) {
        console.log(`[API Reports Backfill] Scanning user ${u.id}`);
        const result = await backfillWeeklyReports(u.id);
        results.push({ userId: u.id, ...result });
      }

      return NextResponse.json({
        success: true,
        backfill: results
      });
    }

    const userId = authUser.userId;

    // Run the backfill audit programmatically for a single user
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
