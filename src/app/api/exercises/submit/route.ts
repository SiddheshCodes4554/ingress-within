import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseLifecycleManager } from '../../../../lib/exercises/exerciseLifecycleManager';
import { IntelligenceOrchestrator } from '../../../../lib/orchestrator/intelligenceOrchestrator';
import { queueRegistry } from '../../../../lib/queue/registry';

/**
 * POST: Completes an exercise, validates answers, transitions state, and enqueues background worker analysis.
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
    const { instanceId } = body;

    if (!instanceId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing instanceId in request body.' } },
        { status: 400 }
      );
    }

    // 1. Fetch current instance details
    const { data: instance, error: fetchErr } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', authUser.userId)
      .single();

    if (fetchErr || !instance) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Exercise instance not found or unauthorized.' } },
        { status: 404 }
      );
    }

    // Prevent double submits
    const terminalStates = ['completed', 'queued', 'analysing', 'finished', 'archived'];
    if (terminalStates.includes(instance.status)) {
      return NextResponse.json({
        success: true,
        message: 'Exercise is already submitted/processed.'
      });
    }

    // 2. Validate that they have at least one answer response (excluding screen draft record)
    const { data: responses, error: respErr } = await supabase
      .from('exercise_responses')
      .select('id')
      .eq('instance_id', instanceId)
      .neq('question_id', '__screen_state')
      .limit(1);

    if (respErr || !responses || responses.length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_SUBMISSION', message: 'Cannot submit an exercise with zero responses.' } },
        { status: 400 }
      );
    }

    // 3. Transition: Current -> Completed
    await ExerciseLifecycleManager.transitionTo(authUser.userId, instanceId, 'completed', {
      transitionReason: 'User clicked submit.'
    });

    // 4. Transition: Completed -> Queued
    await ExerciseLifecycleManager.transitionTo(authUser.userId, instanceId, 'queued', {
      force: true,
      transitionReason: 'Background job enqueued.'
    });

    // 5. Enqueue background analysis job
    const jobId = await IntelligenceOrchestrator.enqueueJob(authUser.userId, 'exercise', `ExerciseCompleted:${instanceId}`);
    await queueRegistry.addJob('exercise_processing', `exercise_${instanceId}`, {
      instance_id: instanceId,
      exercise_id: instance.exercise_id,
      user_id: authUser.userId,
      cycle_id: instance.cycle_id,
      orchestrator_job_id: jobId
    });

    return NextResponse.json({
      success: true,
      message: 'Exercise successfully submitted for background analysis.'
    });
  } catch (err: any) {
    console.error('[API submit exercise] Error:', err.message);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
