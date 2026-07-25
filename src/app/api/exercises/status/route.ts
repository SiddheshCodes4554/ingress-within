import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseInitializationService } from '../../../../lib/exercises/exerciseInitializationService';

/**
 * GET: Retrieves unlock matrices/status of all exercises in the active cycle.
 * Automatically runs ExerciseInitializationService.syncUserInstances to self-heal missing instance rows.
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

    // Fetch active cycle
    let { data: activeCycle, error: cycleErr } = await supabase
      .from('cycles')
      .select('id, current_day, status')
      .eq('user_id', authUser.userId)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (cycleErr) {
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: cycleErr.message } },
        { status: 500 }
      );
    }

    if (!activeCycle) {
      const { data: fallbackCycle } = await supabase
        .from('cycles')
        .select('id, current_day, status')
        .eq('user_id', authUser.userId)
        .eq('status', 'active')
        .maybeSingle();

      if (fallbackCycle) {
        activeCycle = fallbackCycle;
      }
    }

    if (!activeCycle) {
      return NextResponse.json({
        success: true,
        statuses: [],
        counts: { available: 0, pending: 0, completed: 0, locked: 0, total: 0 },
        message: 'No active cycle.'
      });
    }

    const currentDay = activeCycle.current_day || 1;
    const isCompletedCycle = activeCycle.status === 'COMPLETED' || activeCycle.status === 'completed';

    // 1. Run self-healing instance synchronization (creates missing definitions & missing instances)
    const instances = await ExerciseInitializationService.syncUserInstances(
      authUser.userId,
      activeCycle.id,
      currentDay,
      isCompletedCycle
    );

    // 2. Fetch definitions
    const { data: definitions } = await supabase
      .from('exercise_definitions')
      .select('*')
      .eq('active_status', true);

    // 3. Auto-heal any completed/queued/analysing instances that haven't finalized results
    const { ExerciseAnalysisWorker } = await import('../../../../lib/exercises/exerciseAnalysisWorker');
    for (const inst of instances || []) {
      if (['completed', 'queued', 'analysing'].includes(inst.status)) {
        const { data: resRow } = await supabase
          .from('exercise_results')
          .select('id')
          .eq('instance_id', inst.id)
          .maybeSingle();

        if (!resRow) {
          try {
            await ExerciseAnalysisWorker.execute({
              instance_id: inst.id,
              exercise_id: inst.exercise_id,
              user_id: authUser.userId,
              cycle_id: activeCycle.id
            });
            inst.status = 'finished';
          } catch (e: any) {
            console.error('[API exercise status] Auto-heal worker error:', e.message);
          }
        }
      }
    }

    const counts = {
      available: 0,
      pending: 0,
      completed: 0,
      locked: 0,
      total: definitions?.length || 0
    };

    const statuses = (definitions || []).map(def => {
      const inst = instances?.find(i => i.exercise_id === def.id);
      const unlockDay = def.unlock_rules?.day || 1;
      const isUnlocked = isCompletedCycle || currentDay >= unlockDay;

      let computedStatus = 'locked';
      let lockReason: string | null = null;

      if (inst) {
        computedStatus = inst.status;
      } else if (isUnlocked) {
        computedStatus = 'available';
      } else {
        computedStatus = 'locked';
      }

      if (computedStatus === 'locked') {
        lockReason = `Unlocks on Day ${unlockDay} of your cycle (Current Day: ${currentDay})`;
        counts.locked++;
      } else if (['available', 'started', 'in_progress'].includes(computedStatus)) {
        counts.available++;
      } else if (['completed', 'queued', 'analysing'].includes(computedStatus)) {
        counts.pending++;
      } else if (['finished'].includes(computedStatus)) {
        counts.completed++;
      }

      return {
        definition: def,
        instance: inst || null,
        status: computedStatus,
        unlock_day: unlockDay,
        is_unlocked: isUnlocked,
        lock_reason: lockReason
      };
    });

    return NextResponse.json({
      success: true,
      statuses,
      counts
    });
  } catch (err: any) {
    console.error('[API exercise status] Error:', err.message);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
