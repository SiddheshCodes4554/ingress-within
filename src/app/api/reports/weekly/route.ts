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

    // 0. Automatically backfill/heal missing weekly summaries for this user
    try {
      await backfillWeeklyReports(userId);
    } catch (backfillErr: any) {
      console.error('[API Weekly Reports GET] Backfill warning:', backfillErr.message);
    }

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

    // 1.5. Self-healing check: find any reports that are stuck in PENDING / GENERATING / WAITING_FOR_PROCESSING
    if (reports) {
      for (const report of reports) {
        const status = report.status?.toUpperCase();
        if (status !== 'READY' && status !== 'FAILED') {
          const timeSinceUpdate = Date.now() - new Date(report.report_data?.orchestration?.updated_at || report.updated_at || report.created_at).getTime();
          // If stuck for more than 15 seconds, heal inline
          if (timeSinceUpdate > 15 * 1000) {
            console.log(`[Reports API] Report ${report.id} is stuck in status ${status} for ${timeSinceUpdate}ms. Healing inline...`);
            try {
              const { processWeeklySummary } = await import('../../../../lib/queue/workers/weeklySummaryWorker');
              await processWeeklySummary({
                cycle_id: report.cycle_id,
                user_id: userId,
                week_number: report.week_number,
                summary_id: report.id
              });
              // Reload/refresh this report row from database
              const { data: refreshed } = await supabase
                .from('weekly_summaries')
                .select('*')
                .eq('id', report.id)
                .single();
              if (refreshed) {
                Object.assign(report, refreshed);
              }
            } catch (healErr: any) {
              console.error(`[Reports API] Failed to heal stuck report inline:`, healErr.message);
            }
          }
        }
      }
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
