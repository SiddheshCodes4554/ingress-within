import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/db';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { overlayWeeklyReportGraphData } from '../../../../../lib/reportGraphHelper';

/**
 * GET /api/reports/weekly/[id]: Fetches a single weekly report by summary ID.
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const reportId = params.id;

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const userId = authUser.userId;

    const { data: report, error: reportErr } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', userId)
      .maybeSingle();

    if (reportErr) {
      console.error(`[API Weekly Report Detail] Database error fetching report ${reportId}:`, reportErr.message);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve report details.' } },
        { status: 500 }
      );
    }

    if (!report) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Report not found.' } },
        { status: 404 }
      );
    }

    const processedReport = await overlayWeeklyReportGraphData(report, userId);

    return NextResponse.json({
      success: true,
      report: processedReport
    });

  } catch (error: any) {
    console.error(`[API Weekly Report Detail] Error:`, error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
