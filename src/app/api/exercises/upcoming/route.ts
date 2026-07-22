import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseUnlockService } from '../../../../lib/exercises/exerciseUnlockService';

/**
 * GET: Retrieves the list of upcoming/locked exercises for the user's active cycle.
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

    // 1. Fetch user's active cycle and timezone
    const { data: activeCycle, error: cycleErr } = await supabase
      .from('cycles')
      .select('id, start_date')
      .eq('user_id', authUser.userId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (cycleErr) {
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: `Failed to query active cycle: ${cycleErr.message}` } },
        { status: 500 }
      );
    }

    if (!activeCycle) {
      return NextResponse.json({
        success: true,
        upcoming: [],
        message: 'No active cycle found.'
      });
    }

    const { data: user } = await supabase
      .from('users')
      .select('timezone')
      .eq('id', authUser.userId)
      .maybeSingle();

    const timezone = user?.timezone || 'Asia/Kolkata';
    const currentDay = ExerciseUnlockService.calculateCycleDay(activeCycle.start_date, timezone);

    // 2. Fetch all active definitions
    const { data: definitions, error: defErr } = await supabase
      .from('exercise_definitions')
      .select('*')
      .eq('active_status', true);

    if (defErr || !definitions) {
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to query exercise definitions.' } },
        { status: 500 }
      );
    }

    // 3. Fetch existing instances for user in the current cycle
    const { data: instances, error: instErr } = await supabase
      .from('exercise_instances')
      .select('exercise_id, status')
      .eq('user_id', authUser.userId)
      .eq('cycle_id', activeCycle.id);

    if (instErr) {
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to query exercise instances.' } },
        { status: 500 }
      );
    }

    const processedIds = new Set(instances?.map(i => i.exercise_id) || []);

    // 4. Filter and build upcoming list
    const upcoming = definitions
      .filter(def => !processedIds.has(def.id))
      .map(def => {
        const rules = def.unlock_rules || {};
        let daysRemaining: number | string = 'Trigger-based';
        let unlockDay: number | null = null;

        if (rules.strategy === 'immediate') {
          daysRemaining = 0;
          unlockDay = 1;
        } else if (rules.strategy === 'day_milestone' && rules.day) {
          unlockDay = rules.day;
          const diff = rules.day - currentDay;
          daysRemaining = diff > 0 ? diff : 0;
        } else if (rules.strategy === 'manual') {
          daysRemaining = 'Admin unlock only';
        }

        return {
          id: def.id,
          exercise_type: def.exercise_type,
          estimated_duration: def.estimated_duration,
          unlock_strategy: rules.strategy,
          unlock_day: unlockDay,
          days_remaining: daysRemaining,
          cycle: def.cycle
        };
      });

    return NextResponse.json({
      success: true,
      upcoming,
      current_day: currentDay
    });
  } catch (err: any) {
    console.error('[API upcoming exercises] Error:', err.message);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
