import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

/**
 * GET /api/reports/assessment: Fetches the Day 28 assessment report for a specific cycle.
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

    if (!cycleId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing cycle ID.' } },
        { status: 400 }
      );
    }

    // Run monthly maintenance check
    const { OrchestratorScheduler } = await import('../../../../lib/orchestrator/orchestratorScheduler');
    await OrchestratorScheduler.runMonthlyMaintenance(userId);

    let { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch cycle assessment: ${error.message}`);
    }

    // If assessment exists but generation_status is pending or failed, inline process it immediately
    if (assessment && (assessment.generation_status === 'pending' || assessment.generation_status === 'failed')) {
      const { processMonthlyReport } = await import('../../../../lib/queue/workers/monthlyReportWorker');
      try {
        await processMonthlyReport({
          cycle_id: cycleId,
          user_id: userId,
          assessment_id: assessment.id,
          month_number: 1
        });

        // Fetch refreshed assessment row
        const { data: refreshed } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', assessment.id)
          .single();
        if (refreshed) {
          assessment = refreshed;
        }
      } catch (procErr: any) {
        console.error(`[API Assessment GET] Inline processing failed for assessment ${assessment.id}:`, procErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      assessment
    });

  } catch (error: any) {
    console.error('[API Assessment GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
