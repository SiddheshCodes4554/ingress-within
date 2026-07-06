import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

/**
 * GET /api/reports/weekly: Fetches all weekly reports for the authenticated user.
 * Pure read — never triggers report generation. Use /api/reports/backfill to generate.
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

    // Fetch all weekly summaries for this user only (strict user isolation)
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

    const { data: reports, error: reportsErr } = await query.order('week_number', { ascending: true });

    if (reportsErr) {
      throw new Error(`Failed to fetch weekly summaries: ${reportsErr.message}`);
    }

    return NextResponse.json({
      success: true,
      reports: reports || []
    });

  } catch (error: any) {
    console.error('[API Weekly Reports GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
