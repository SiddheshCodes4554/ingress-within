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

    let isAssessmentGate = false;
    let finishedCycle = null;

    // If no active cycle, check if there's a completed cycle requiring assessment
    if (!cycle) {
      const { data: completedCycle, error: completedErr } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED')
        .eq('assessment_completed', false)
        .order('cycle_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (completedErr) {
        console.error('[API Cycles Status] Error fetching completed cycle:', completedErr);
      }

      if (completedCycle) {
        cycle = completedCycle;
        isAssessmentGate = true;
      } else {
        // If neither exists, let's look for any active cycle (perhaps using lowercase status fallback)
        const { data: fallbackCycle } = await supabase
          .from('cycles')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (fallbackCycle) {
          cycle = fallbackCycle;
        } else {
          return NextResponse.json({
            success: true,
            hasCycle: false,
            message: 'No active cycle. Onboarding may be incomplete.'
          });
        }
      }
    }

    // 2. Perform day calculation and check duration
    const startDate = new Date(cycle.start_date || cycle.started_at);
    const today = new Date();
    
    // Normalize dates to midnight for accurate day difference
    const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = todayMidnight.getTime() - startMidnight.getTime();
    const calculatedDay = Math.floor(diffTime / (24 * 60 * 60 * 1000)) + 1;
    const currentDay = Math.max(1, calculatedDay);

    let updatedCycle = { ...cycle };

    // Auto-complete cycle if it has reached or exceeded configured total_days (default 30)
    if (calculatedDay > cycle.total_days && cycle.status === 'ACTIVE') {
      console.log(`[API Cycles Status] Cycle ${cycle.cycle_number} duration reached. Transitioning to COMPLETED.`);
      const { data: completedRes, error: completeErr } = await supabase
        .from('cycles')
        .update({
          status: 'COMPLETED',
          assessment_available: true,
          completed_at: new Date().toISOString(),
          current_day: cycle.total_days // Cap at total days when completed
        })
        .eq('id', cycle.id)
        .select()
        .single();

      if (completeErr) {
        console.error('[API Cycles Status] Error marking cycle completed:', completeErr);
      } else if (completedRes) {
        updatedCycle = completedRes;
        isAssessmentGate = true;
      }
    } else if (cycle.status === 'ACTIVE') {
      // Otherwise, update current_day column in db to keep it in sync
      const { data: syncRes } = await supabase
        .from('cycles')
        .update({ current_day: Math.min(cycle.total_days, currentDay) })
        .eq('id', cycle.id)
        .select()
        .single();
      if (syncRes) {
        updatedCycle = syncRes;
      }
    }

    // 3. Count entries written in this cycle
    const { data: cycleEntries, error: entriesErr } = await supabase
      .from('entries')
      .select('id, created_at, cycle_day')
      .eq('cycle_id', updatedCycle.id);

    if (entriesErr) {
      console.error('[API Cycles Status] Error fetching cycle entries:', entriesErr);
    }

    const entriesList = cycleEntries || [];
    const entriesCount = entriesList.length;

    // Count distinct days on which entries were written in this cycle
    const uniqueDaysWritten = Array.from(new Set(entriesList.map(e => e.cycle_day || 1)));
    const daysCompleted = uniqueDaysWritten.length;

    // Fetch all user entries to calculate total streak
    const { data: allUserEntries } = await supabase
      .from('entries')
      .select('id, created_at')
      .eq('user_id', userId);

    const streak = calculateStreak(allUserEntries || []);

    // Save counts back to DB
    await supabase
      .from('cycles')
      .update({
        entries_count: entriesCount,
        days_completed: daysCompleted
      })
      .eq('id', updatedCycle.id);

    // Compute progress details
    const activeDay = Math.min(updatedCycle.total_days, currentDay);
    const progressPercentage = Math.round((activeDay / updatedCycle.total_days) * 100);
    const daysRemaining = Math.max(0, updatedCycle.total_days - activeDay);
    const writingConsistency = activeDay > 0 ? Math.round((daysCompleted / activeDay) * 100) : 0;

    return NextResponse.json({
      success: true,
      hasCycle: true,
      isAssessmentGate,
      cycle: {
        id: updatedCycle.id,
        cycleNumber: updatedCycle.cycle_number || updatedCycle.number,
        status: updatedCycle.status,
        startDate: updatedCycle.start_date || updatedCycle.started_at,
        endDate: updatedCycle.end_date || updatedCycle.ended_at,
        totalDays: updatedCycle.total_days,
        currentDay: activeDay,
        daysCompleted: daysCompleted,
        entriesCount: entriesCount,
        assessmentCompleted: updatedCycle.assessment_completed,
        assessmentAvailable: updatedCycle.assessment_available,
        progressPercentage,
        daysRemaining,
        streak,
        writingConsistency
      }
    });

  } catch (error) {
    console.error('[API Cycles Status] Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
