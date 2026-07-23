import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseLifecycleManager } from '../../../../lib/exercises/exerciseLifecycleManager';

/**
 * POST: Transitions an available/locked exercise instance to 'started'.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { instanceId, exerciseId } = body;

    let targetInstanceId = instanceId;

    if (!targetInstanceId && exerciseId) {
      const { supabase } = await import('../../../../lib/db');
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('id')
        .eq('user_id', authUser.userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (activeCycle) {
        const { data: inst } = await supabase
          .from('exercise_instances')
          .select('id, status')
          .eq('user_id', authUser.userId)
          .eq('cycle_id', activeCycle.id)
          .eq('exercise_id', exerciseId)
          .maybeSingle();

        if (inst) {
          targetInstanceId = inst.id;
        } else {
          const { data: newInst } = await supabase
            .from('exercise_instances')
            .insert({
              user_id: authUser.userId,
              cycle_id: activeCycle.id,
              exercise_id: exerciseId,
              status: 'available',
              locked: false,
              available: true,
              started: false,
              completed: false,
              expired: false,
              unlock_time: new Date().toISOString(),
              version: '1.0'
            })
            .select('id')
            .single();

          if (newInst) {
            targetInstanceId = newInst.id;
          }
        }
      }
    }

    if (!targetInstanceId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing instanceId or valid exerciseId in request body.' } },
        { status: 400 }
      );
    }

    const instance = await ExerciseLifecycleManager.transitionTo(authUser.userId, targetInstanceId, 'started', {
      transitionReason: 'User clicked Start Exercise.'
    });

    return NextResponse.json({
      success: true,
      instance
    });
  } catch (err: any) {
    console.error('[API start exercise] Error:', err.message);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
