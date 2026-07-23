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

    // Non-blocking monthly maintenance trigger
    const { OrchestratorScheduler } = await import('../../../../lib/orchestrator/orchestratorScheduler');
    void OrchestratorScheduler.runMonthlyMaintenance(userId).catch(err => {
      console.error('[API Assessment GET] Background monthly maintenance failed:', err.message);
    });

    let { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch cycle assessment: ${error.message}`);
    }

    // If assessment row is missing, pending, held, or contains placeholder text, trigger generation inline
    const isPlaceholder = !assessment?.report_text || assessment.report_text.length < 50 || assessment.report_text.startsWith('Auto-Transition') || assessment.report_text.startsWith('Completed Transition');
    const needsGeneration = !assessment || assessment.generation_status !== 'ready' || isPlaceholder;

    if (needsGeneration) {
      console.log(`[API Assessment GET] Assessment for cycle ${cycleId} needs generation/repair (status: ${assessment?.generation_status || 'missing'}). Generating now...`);
      let assId = assessment?.id;
      if (!assId) {
        const { data: newAss } = await supabase
          .from('assessments')
          .insert({
            user_id: userId,
            cycle_id: cycleId,
            generation_status: 'pending',
            unlocked_at: new Date().toISOString(),
            ei_avg: 0,
            pr_avg: 0,
            sa_avg: 0,
            dt_score: 0,
            normalised_sa: 0,
            risk_total: 0,
            path_assignment: 'second_cycle',
            branch_assignment: 'A',
            entry_count: 0
          })
          .select('id')
          .single();
        assId = newAss?.id;
      }

      if (assId) {
        try {
          const { processMonthlyReport } = await import('../../../../lib/queue/workers/monthlyReportWorker');
          await processMonthlyReport({
            cycle_id: cycleId,
            user_id: userId,
            assessment_id: assId
          });

          // Fetch fresh ready assessment
          const { data: freshAssessment } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', assId)
            .maybeSingle();
          if (freshAssessment) {
            assessment = freshAssessment;
          }
        } catch (genErr: any) {
          console.error('[API Assessment GET] Error generating assessment inline:', genErr.message);
        }
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
