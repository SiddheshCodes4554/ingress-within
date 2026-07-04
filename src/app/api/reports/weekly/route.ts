import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

/**
 * GET /api/reports/weekly: Fetches all weekly reports for the user.
 * Automatically triggers the backfill orchestrator to generate reports for completed weeks.
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
    const cycleId = request.nextUrl.searchParams.get('cycleId');
    const weekNumber = request.nextUrl.searchParams.get('weekNumber');

    // 1. Fetch all reports from weekly_summaries directly (Read-only)
    let query = supabase
      .from('weekly_summaries')
      .select('*')
      .eq('user_id', userId);

    if (cycleId) {
      query = query.eq('cycle_id', cycleId);
    }
    if (weekNumber) {
      const parsedWeek = parseInt(weekNumber);
      if (!isNaN(parsedWeek)) {
        query = query.eq('week_number', parsedWeek);
      }
    }

    const { data: reports, error: reportsErr } = await query.order('week_number', { ascending: false });

    if (reportsErr) {
      throw new Error(`Failed to fetch weekly summaries: ${reportsErr.message}`);
    }

    return NextResponse.json({
      success: true,
      reports: reports || [],
      backfill: null
    });

  } catch (error: any) {
    console.error('[API Weekly Reports GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
