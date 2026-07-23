import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

/**
 * GET: Retrieves unlock matrices/status of all exercises in the active cycle.
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
    const { data: activeCycle, error: cycleErr } = await supabase
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
      return NextResponse.json({
        success: true,
        statuses: [],
        message: 'No active cycle.'
      });
    }

    const { data: definitions, error: defErr } = await supabase
      .from('exercise_definitions')
      .select('*')
      .eq('active_status', true);

    if (defErr) {
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: defErr.message } },
        { status: 500 }
      );
    }

    const { data: instances, error: instErr } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('user_id', authUser.userId)
      .eq('cycle_id', activeCycle.id);

    if (instErr) {
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: instErr.message } },
        { status: 500 }
      );
    }

    const currentDay = activeCycle.current_day || 1;
    const isCompletedCycle = activeCycle.status === 'COMPLETED';

    // Auto-heal any completed/queued/analysing instances that haven't finalized results
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

    const statuses = (definitions || []).map(def => {
      const inst = instances?.find(i => i.exercise_id === def.id);
      const unlockDay = def.unlock_rules?.day || 1;
      const isUnlocked = isCompletedCycle || currentDay >= unlockDay;

      let computedStatus = 'locked';
      if (inst) {
        computedStatus = inst.status;
      } else if (isUnlocked) {
        computedStatus = 'available';
      } else {
        computedStatus = 'locked';
      }

      return {
        definition: def,
        instance: inst || null,
        status: computedStatus,
        unlock_day: unlockDay,
        is_unlocked: isUnlocked
      };
    });

    return NextResponse.json({
      success: true,
      statuses
    });
  } catch (err: any) {
    console.error('[API exercise status] Error:', err.message);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
