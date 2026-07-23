import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

function calculateStreak(entries: any[]): number {
  if (!entries || entries.length === 0) return 0;
  
  // Extract unique dates of entries
  const dateStrings = entries.map(e => new Date(e.created_at).toDateString());
  const uniqueDates = Array.from(new Set(dateStrings)).map(d => new Date(d));
  
  // Sort descending (newest first)
  uniqueDates.sort((a, b) => b.getTime() - a.getTime());
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  
  const mostRecent = uniqueDates[0];
  mostRecent.setHours(0, 0, 0, 0);
  
  if (mostRecent.getTime() < yesterday.getTime()) {
    return 0; // Streak broken (no entry yesterday or today)
  }
  
  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = uniqueDates[i];
    current.setHours(0, 0, 0, 0);
    const prev = uniqueDates[i + 1];
    prev.setHours(0, 0, 0, 0);
    
    const diffTime = current.getTime() - prev.getTime();
    const diffDays = Math.round(diffTime / (24 * 60 * 60 * 1000));
    
    if (diffDays === 1) {
      streak++;
    } else if (diffDays > 1) {
      break;
    }
  }
  return streak;
}

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
    let isAssessmentGate = false;

    // 1. Fetch active cycle
    let { data: cycle, error: cycleErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (cycleErr) {
      console.error('[API Cycles Status] Error fetching active cycle:', cycleErr);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve active cycle.' } },
        { status: 500 }
      );
    }

    if (!cycle) {
      const { data: fallbackCycle } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
      if (fallbackCycle) {
        cycle = fallbackCycle;
      }
    }

    let completedCycleNeedAssessment: any = null;
    if (!cycle) {
      const { data: completedCycle } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED')
        .eq('assessment_completed', false)
        .order('cycle_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (completedCycle) {
        completedCycleNeedAssessment = completedCycle;
      }
    }

    let needsTransition = false;
    let transitionBaseCycle: any = null;

    const clientDateStr = request.headers.get('x-client-date');
    let todayMidnight: Date;
    if (clientDateStr) {
      todayMidnight = new Date(clientDateStr + 'T00:00:00Z');
    } else {
      const today = new Date();
      todayMidnight = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    }

    if (cycle) {
      const startDateStr = (cycle.start_date || cycle.started_at || '').split('T')[0];
      const startMidnight = new Date(startDateStr + 'T00:00:00Z');
      const diffTime = todayMidnight.getTime() - startMidnight.getTime();
      const calculatedDay = Math.floor(diffTime / (24 * 60 * 60 * 1000)) + 1;
      
      if (calculatedDay > cycle.total_days && (cycle.status === 'ACTIVE' || cycle.status === 'active')) {
        needsTransition = true;
        transitionBaseCycle = cycle;
      }
    } else if (completedCycleNeedAssessment) {
      needsTransition = true;
      transitionBaseCycle = completedCycleNeedAssessment;
    }

    if (needsTransition && transitionBaseCycle) {
      console.log(`[API Cycles Status] Auto-transitioning cycle ${transitionBaseCycle.id} to next cycle.`);
      // 1. Create assessments record (mock/auto-fill for DB integrity)
      try {
        const { data: scores } = await supabase
          .from('entry_scores')
          .select('*')
          .eq('user_id', userId)
          .eq('cycle_id', transitionBaseCycle.id);

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
        const dt_score = Math.round((ei_avg + pr_avg) / 2 * 10);
        const normalised_sa = Math.round(sa_avg * 10);

        const { count: entriesCount } = await supabase
          .from('entries')
          .select('id', { count: 'exact', head: true })
          .eq('cycle_id', transitionBaseCycle.id)
          .eq('user_id', userId);

        await supabase
          .from('assessments')
          .delete()
          .eq('user_id', userId)
          .eq('cycle_id', transitionBaseCycle.id);

        const { data: newAssessment } = await supabase
          .from('assessments')
          .insert({
            user_id: userId,
            cycle_id: transitionBaseCycle.id,
            ei_avg,
            pr_avg,
            sa_avg,
            dt_score,
            normalised_sa,
            risk_total: 0,
            path_assignment: 'second_cycle',
            branch_assignment: 'A',
            stability_gate_triggered: false,
            entry_count: entriesCount || 0,
            generation_status: 'pending',
            unlocked_at: new Date().toISOString()
          })
          .select()
          .maybeSingle();

        if (newAssessment) {
          const { queueRegistry } = await import('../../../../lib/queue/registry');
          await queueRegistry.addJob('monthly_report_generation', `assessment_${newAssessment.id}`, {
            cycle_id: transitionBaseCycle.id,
            user_id: userId,
            assessment_id: newAssessment.id,
            month_number: transitionBaseCycle.cycle_number || transitionBaseCycle.number || 1
          });
        }
      } catch (err) {
        console.error('[API Cycles Status] Non-fatal error inserting auto-assessment:', err);
      }

      // 2. Mark current cycle as completed
      try {
        await supabase
          .from('cycles')
          .update({
            status: 'COMPLETED',
            assessment_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', transitionBaseCycle.id);
      } catch (err) {
        console.error('[API Cycles Status] Error marking cycle completed:', err);
      }

      // 3. Create next cycle
      const nextCycleNumber = (transitionBaseCycle.cycle_number || transitionBaseCycle.number || 1) + 1;
      const todayStr = new Date().toISOString().split('T')[0];

      let newCycle = null;
      const { data: insCycle, error: createCycleErr } = await supabase
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
        .maybeSingle();

      if (createCycleErr) {
        console.warn('[API Cycles Status] Standard cycle insert failed, trying fallback:', createCycleErr.message);
        const { data: fallbackNewCycle } = await supabase
          .from('cycles')
          .insert({
            user_id: userId,
            number: nextCycleNumber,
            status: 'active',
            started_at: todayStr,
            total_days: 30
          })
          .select()
          .maybeSingle();
        newCycle = fallbackNewCycle;
      } else {
        newCycle = insCycle;
      }

      if (newCycle) {
        cycle = newCycle;
      } else {
        const { data: reloaded } = await supabase
          .from('cycles')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'ACTIVE')
          .maybeSingle();
        if (reloaded) cycle = reloaded;
      }
    }

    if (!cycle) {
      return NextResponse.json({
        success: true,
        hasCycle: false,
        message: 'No active cycle. Onboarding may be incomplete.'
      });
    }

    // 2. Perform day calculation and check duration without mutating stored cycle state.
    const startDateStr = (cycle.start_date || cycle.started_at || '').split('T')[0];
    const startMidnight = new Date(startDateStr + 'T00:00:00Z');
    const diffTime = todayMidnight.getTime() - startMidnight.getTime();
    const calculatedDay = Math.floor(diffTime / (24 * 60 * 60 * 1000)) + 1;
    const currentDay = Math.max(1, calculatedDay);

    const activeDay = Math.min(cycle.total_days, currentDay);
    const progressPercentage = Math.round((activeDay / cycle.total_days) * 100);
    const daysRemaining = Math.max(0, cycle.total_days - activeDay);
    const isCycleExpired = calculatedDay > cycle.total_days && cycle.status === 'ACTIVE';

    // 3. Count entries written in this cycle
    const { data: cycleEntries, error: entriesErr } = await supabase
      .from('entries')
      .select('id, created_at, cycle_day')
      .eq('cycle_id', cycle.id)
      .eq('user_id', userId);

    if (entriesErr) {
      console.error('[API Cycles Status] Error fetching cycle entries:', entriesErr);
    }

    const entriesList = cycleEntries || [];
    const entriesCount = entriesList.length;

    // Count distinct days on which entries were written in this cycle
    const uniqueDaysWritten = Array.from(new Set(entriesList.map(e => e.cycle_day || 1)));
    const daysCompleted = uniqueDaysWritten.length;

    // Fetch recent user entries to calculate total streak (limit to 200 to optimize performance)
    const { data: allUserEntries } = await supabase
      .from('entries')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    const streak = calculateStreak(allUserEntries || []);

    const writingConsistency = activeDay > 0 ? Math.round((daysCompleted / activeDay) * 100) : 0;

    if (isCycleExpired) {
      isAssessmentGate = true;
    }

    const cyclePayload = {
      id: cycle.id,
      cycleNumber: cycle.cycle_number || cycle.number,
      status: cycle.status,
      startDate: cycle.start_date || cycle.started_at,
      endDate: cycle.end_date || cycle.ended_at,
      totalDays: cycle.total_days,
      currentDay: activeDay,
      daysCompleted,
      entriesCount,
      assessmentCompleted: cycle.assessment_completed,
      assessmentAvailable: cycle.assessment_available,
      progressPercentage,
      daysRemaining,
      streak,
      writingConsistency
    };

    return NextResponse.json({
      success: true,
      hasCycle: true,
      isAssessmentGate,
      cycle: cyclePayload
    });

  } catch (error) {
    console.error('[API Cycles Status] Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
