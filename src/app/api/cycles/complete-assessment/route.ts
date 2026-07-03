import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

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
    const body = await request.json().catch(() => ({}));
    const { answers } = body;

    // 1. Find the latest completed cycle requiring assessment
    const { data: cycle, error: cycleErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'COMPLETED')
      .eq('assessment_completed', false)
      .order('cycle_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cycleErr || !cycle) {
      console.error('[API Cycles Transition] Completed cycle not found or query error:', cycleErr);
      return NextResponse.json(
        { error: { code: 'CYCLE_NOT_FOUND', message: 'No completed cycle found requiring assessment.' } },
        { status: 400 }
      );
    }

    // 2. Compute average psychometrics for the assessment report from entry_scores
    const { data: scores } = await supabase
      .from('entry_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycle.id);

    let ei_sum = 0, pr_sum = 0, sa_sum = 0, validScoresCount = 0;
    if (scores && scores.length > 0) {
      scores.forEach(s => {
        if (s.day_ei !== null && s.day_ei !== undefined) {
          ei_sum += Number(s.day_ei);
          pr_sum += Number(s.day_pr);
          sa_sum += Number(s.day_sa);
          validScoresCount++;
        }
      });
    }

    const ei_avg = validScoresCount > 0 ? (ei_sum / validScoresCount) : 5.0;
    const pr_avg = validScoresCount > 0 ? (pr_sum / validScoresCount) : 4.0;
    const sa_avg = validScoresCount > 0 ? (sa_sum / validScoresCount) : 6.0;
    const dt_score = Math.round((ei_avg + pr_avg) / 2 * 10); // distress score
    const normalised_sa = Math.round(sa_avg * 10);

    // Count entries
    const { count: entriesCount } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('cycle_id', cycle.id)
      .eq('user_id', userId);

    // 3. Create transition assessment report
    const { error: assessmentErr } = await supabase
      .from('assessments')
      .insert({
        user_id: userId,
        cycle_id: cycle.id,
        ei_avg,
        pr_avg,
        sa_avg,
        dt_score,
        normalised_sa,
        risk_total: 0,
        path_assignment: 'Guided Integration',
        branch_assignment: 'Contemplative Focus',
        stability_gate_triggered: false,
        entry_count: entriesCount || 0,
        generation_status: 'complete',
        report_text: `Completed Transition Assessment for Cycle ${cycle.cycle_number || cycle.number}. Answers: ${JSON.stringify(answers || {})}`,
        unlocked_at: new Date().toISOString(),
        generated_at: new Date().toISOString()
      });

    if (assessmentErr) {
      console.error('[API Cycles Transition] Error saving assessment record:', assessmentErr);
    }

    // 4. Update current cycle: set assessment_completed = true
    const { error: updateCycleErr } = await supabase
      .from('cycles')
      .update({
        assessment_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', cycle.id)
      .eq('user_id', userId);

    if (updateCycleErr) {
      console.error('[API Cycles Transition] Error updating completed cycle:', updateCycleErr);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to update completed cycle.' } },
        { status: 500 }
      );
    }

    // 5. Create NEXT active cycle (Cycle N+1)
    const nextCycleNumber = (cycle.cycle_number || cycle.number) + 1;
    const todayStr = new Date().toISOString().split('T')[0];

    const { data: newCycle, error: createCycleErr } = await supabase
      .from('cycles')
      .insert({
        user_id: userId,
        cycle_number: nextCycleNumber,
        status: 'ACTIVE',
        start_date: todayStr,
        total_days: 30,
        current_day: 1,
        days_completed: 0,
        entries_count: 0,
        assessment_completed: false,
        assessment_available: false
      })
      .select()
      .single();

    if (createCycleErr) {
      console.error('[API Cycles Transition] Error creating next cycle:', createCycleErr);
      // Fallback: If migration was not run yet and cycle_number is missing, try number/started_at fallback
      if (createCycleErr.message.includes('column') || createCycleErr.code === 'PGRST200' || createCycleErr.code === '42703') {
        const { data: fallbackNewCycle, error: fallbackCreateErr } = await supabase
          .from('cycles')
          .insert({
            user_id: userId,
            number: nextCycleNumber,
            status: 'active',
            started_at: todayStr,
            total_days: 30
          })
          .select()
          .single();

        if (fallbackCreateErr) {
          console.error('[API Cycles Transition] Fallback cycles creation failed:', fallbackCreateErr);
          return NextResponse.json(
            { error: { code: 'DATABASE_ERROR', message: 'Failed to provision next cycle.' } },
            { status: 500 }
          );
        }
        return NextResponse.json({
          success: true,
          message: 'Cycle completed and next cycle created successfully (fallback).',
          cycle: fallbackNewCycle
        });
      }
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to create next cycle.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cycle completed and next cycle created successfully.',
      cycle: {
        id: newCycle.id,
        cycleNumber: newCycle.cycle_number,
        status: newCycle.status,
        startDate: newCycle.start_date,
        totalDays: newCycle.total_days,
        currentDay: 1
      }
    });

  } catch (error) {
    console.error('[API Cycles Transition] Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
