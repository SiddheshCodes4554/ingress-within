import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/db';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';
import { ExerciseLifecycleManager } from '../../../../../lib/exercises/exerciseLifecycleManager';
import { IntelligenceOrchestrator } from '../../../../../lib/orchestrator/intelligenceOrchestrator';
import { queueRegistry } from '../../../../../lib/queue/registry';

/**
 * POST: Handles admin overrides (unlock, complete, rebuild, retry, archive).
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
    const { action, params } = body;

    if (!action || !params) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing action or params in request body.' } },
        { status: 400 }
      );
    }

    const userId = authUser.userId;

    switch (action) {
      case 'unlock': {
        const { exerciseId, cycleId } = params;
        if (!exerciseId || !cycleId) {
          return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Missing exerciseId or cycleId.' } }, { status: 400 });
        }

        // Fetch definition
        const { data: def } = await supabase
          .from('exercise_definitions')
          .select('*')
          .eq('id', exerciseId)
          .single();

        if (!def) {
          return NextResponse.json({ error: { code: 'NOT_FOUND', message: `Definition not found: ${exerciseId}` } }, { status: 404 });
        }

        // Create new available instance
        const { data: instance, error } = await supabase
          .from('exercise_instances')
          .insert({
            user_id: userId,
            exercise_id: exerciseId,
            cycle_id: cycleId,
            status: 'available',
            locked: false,
            available: true,
            started: false,
            completed: false,
            expired: false,
            unlock_time: new Date().toISOString(),
            version: def.provider_version || '1.0'
          })
          .select()
          .single();

        if (error || !instance) {
          return NextResponse.json({ error: { code: 'DATABASE_ERROR', message: `Failed to unlock manually: ${error?.message}` } }, { status: 500 });
        }

        // Log trace event
        await supabase.from('exercise_events').insert({
          instance_id: instance.id,
          user_id: userId,
          event_type: 'unlocked',
          payload: { strategy: 'manual_override', admin: true }
        });

        // Publish event
        const { ExerciseEventPublisher } = await import('../../../../../lib/exercises/exerciseEventPublisher');
        await ExerciseEventPublisher.publishUnlocked(userId, {
          instance_id: instance.id,
          exercise_id: exerciseId,
          cycle_id: cycleId
        });

        return NextResponse.json({ success: true, instance });
      }

      case 'complete': {
        const { instanceId } = params;
        if (!instanceId) {
          return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Missing instanceId.' } }, { status: 400 });
        }

        // Fetch instance
        const { data: instance } = await supabase
          .from('exercise_instances')
          .select('*')
          .eq('id', instanceId)
          .single();

        if (!instance) {
          return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Instance not found.' } }, { status: 404 });
        }

        // Transition: current -> completed
        await ExerciseLifecycleManager.transitionTo(userId, instanceId, 'completed', {
          force: true,
          transitionReason: 'Admin manual complete override.'
        });

        // Transition: completed -> queued
        const updated = await ExerciseLifecycleManager.transitionTo(userId, instanceId, 'queued', {
          force: true,
          transitionReason: 'Admin manual queue override.'
        });

        // Queue analysis job
        const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'exercise', `ExerciseAdminComplete:${instanceId}`);
        await queueRegistry.addJob('exercise_processing', `exercise_admin_complete_${instanceId}`, {
          instance_id: instanceId,
          exercise_id: instance.exercise_id,
          user_id: userId,
          cycle_id: instance.cycle_id,
          orchestrator_job_id: jobId
        });

        return NextResponse.json({ success: true, instance: updated });
      }

      case 'retry':
      case 'rebuild': {
        const { instanceId } = params;
        if (!instanceId) {
          return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Missing instanceId.' } }, { status: 400 });
        }

        // Fetch instance
        const { data: instance } = await supabase
          .from('exercise_instances')
          .select('*')
          .eq('id', instanceId)
          .single();

        if (!instance) {
          return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Instance not found.' } }, { status: 404 });
        }

        // Transition: current -> queued
        const updated = await ExerciseLifecycleManager.transitionTo(userId, instanceId, 'queued', {
          force: true,
          transitionReason: 'Admin manual retry/rebuild override.'
        });

        // Queue analysis job
        const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'exercise', `ExerciseAdminRebuild:${instanceId}`);
        await queueRegistry.addJob('exercise_processing', `exercise_admin_rebuild_${instanceId}`, {
          instance_id: instanceId,
          exercise_id: instance.exercise_id,
          user_id: userId,
          cycle_id: instance.cycle_id,
          orchestrator_job_id: jobId
        });

        // Broadcast rebuilt event
        const { ExerciseEventPublisher } = await import('../../../../../lib/exercises/exerciseEventPublisher');
        await ExerciseEventPublisher.publishRebuilt(userId, {
          instance_id: instanceId,
          exercise_id: instance.exercise_id,
          cycle_id: instance.cycle_id
        });

        return NextResponse.json({ success: true, instance: updated });
      }

      case 'archive': {
        const { instanceId } = params;
        if (!instanceId) {
          return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Missing instanceId.' } }, { status: 400 });
        }

        const updated = await ExerciseLifecycleManager.transitionTo(userId, instanceId, 'archived', {
          force: true,
          transitionReason: 'Admin manual archive override.'
        });

        return NextResponse.json({ success: true, instance: updated });
      }

      default:
        return NextResponse.json({ error: { code: 'BAD_REQUEST', message: `Unsupported action: ${action}` } }, { status: 400 });
    }
  } catch (err: any) {
    console.error('[API admin exercise action] Error:', err.message);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
