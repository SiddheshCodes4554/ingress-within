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

    // 2. Perform day calculation and check duration without mutating stored cycle state.
    const startDate = new Date(cycle.start_date || cycle.started_at);
    const today = new Date();
    
    // Normalize dates to midnight for accurate day difference
    const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
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
