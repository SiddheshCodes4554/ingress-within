import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseProgressService } from '../../../../lib/exercises/exerciseProgressService';

/**
 * POST: Saves user intermediate answers/responses during an exercise.
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
    const { instanceId, exerciseId, questionId, stepId, response, metadata } = body;

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
          .select('id')
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
              status: 'started',
              locked: false,
              available: true,
              started: true,
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

    if (!targetInstanceId || !questionId || !stepId || response === undefined) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing required parameters: instanceId (or valid exerciseId), questionId, stepId, and response.' } },
        { status: 400 }
      );
    }

    await ExerciseProgressService.saveProgress(
      authUser.userId,
      targetInstanceId,
      questionId,
      stepId,
      response,
      metadata || {}
    );

    return NextResponse.json({
      success: true,
      message: 'Progress saved successfully.'
    });
  } catch (err: any) {
    console.error('[API save progress] Error:', err.message);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
