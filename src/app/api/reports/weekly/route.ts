import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { backfillWeeklyReports } from '../../../../lib/weeklyReportBackfill';
import { overlayWeeklyReportGraphData } from '../../../../lib/reportGraphHelper';

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

    // 2. Perform version check & trigger background rebuild if versions differ
    const { data: userVersions } = await supabase
      .from('user_intelligence_versions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const currentEngine = '2.0';
    const currentPrompt = '1.0';

    const versionMismatch = !userVersions || 
      userVersions.reports_engine_version !== currentEngine || 
      userVersions.reports_prompt_version !== currentPrompt;

    if (versionMismatch) {
      console.log(`[Reports API] Rebuild/Backfill needed. Scheduling async rebuild...`);
      const { queueRegistry } = await import('../../../../lib/queue/registry');
      await queueRegistry.addJob(
        'intelligence_rebuild',
        `rebuild_reports_${userId}`,
        { user_id: userId, subsystem: 'reports' },
        `rebuild_reports_${userId}`
      );
    }

    // Recalculate/overlay Reflection Depth and consistency dynamically
    const processedReports: any[] = [];
    if (reports) {
      for (const report of reports) {
        processedReports.push(await overlayWeeklyReportGraphData(report, userId));
      }
    }

    return NextResponse.json({
      success: true,
      reports: processedReports,
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
