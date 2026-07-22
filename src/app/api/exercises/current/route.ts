import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseUnlockService } from '../../../../lib/exercises/exerciseUnlockService';

/**
 * GET: Fetches the current active or available exercise instance for the user.
 * Evaluates unlock eligibility inline if no active exercises exist.
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

    // 1. Fetch user's active cycle
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
        exercise: null,
        message: 'No active cycle found.'
      });
    }

    // 2. Query existing started or available instances
    const { data: instances, error: instErr } = await supabase
      .from('exercise_instances')
      .select('*, definition:exercise_definitions(*)')
      .eq('user_id', authUser.userId)
      .eq('cycle_id', activeCycle.id)
      .in('status', ['started', 'in_progress', 'available'])
      .order('created_at', { ascending: false });

    if (instErr) {
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: instErr.message } },
        { status: 500 }
      );
    }

    if (instances && instances.length > 0) {
      // Prioritize active ones (started / in_progress) over available
      const active = instances.find(inst => inst.status === 'started' || inst.status === 'in_progress');
      return NextResponse.json({
        success: true,
        exercise: active || instances[0]
      });
    }

    // 3. No active instances: evaluate unlocks inline
    const { data: user } = await supabase
      .from('users')
      .select('timezone')
      .eq('id', authUser.userId)
      .maybeSingle();

    const timezone = user?.timezone || 'Asia/Kolkata';
    const currentDay = ExerciseUnlockService.calculateCycleDay(activeCycle.start_date, timezone);

    const unlocked = await ExerciseUnlockService.processUnlocks(authUser.userId, activeCycle.id, timezone, currentDay);

    return NextResponse.json({
      success: true,
      exercise: unlocked.length > 0 ? unlocked[0] : null
    });
  } catch (err: any) {
    console.error('[API current exercise] Error:', err.message);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
