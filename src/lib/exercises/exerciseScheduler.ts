import { supabase } from '../db';
import { ExerciseUnlockService } from './exerciseUnlockService';
import { ExerciseLifecycleManager } from './exerciseLifecycleManager';
import { IntelligenceOrchestrator } from '../orchestrator/intelligenceOrchestrator';
import { queueRegistry } from '../queue/registry';

export class ExerciseScheduler {
  /**
   * Run scheduler maintenance tasks.
   * Performs unlocks, repairs stale analyses, and auto-retries failed analyses.
   */
  public static async runMaintenance(): Promise<void> {
    console.log('[ExerciseScheduler] Running scheduled background maintenance...');

    await this.unlockEligibleExercises();
    await this.repairStaleAnalyses();
    await this.retryFailedAnalyses();

    console.log('[ExerciseScheduler] Maintenance complete.');
  }

  /**
   * 1. Evaluates and unlocks exercises for all active cycles timezone-aware.
   */
  private static async unlockEligibleExercises(): Promise<void> {
    try {
      // Fetch all active cycles
      const { data: activeCycles, error } = await supabase
        .from('cycles')
        .select('id, user_id, start_date')
        .eq('status', 'ACTIVE');

      if (error || !activeCycles) {
        console.error('[ExerciseScheduler] Failed to fetch active cycles:', error?.message);
        return;
      }

      console.log(`[ExerciseScheduler] Unlocking eligible exercises for ${activeCycles.length} active cycles...`);

      for (const cycle of activeCycles) {
        // Query user's timezone
        const { data: user } = await supabase
          .from('users')
          .select('timezone')
          .eq('id', cycle.user_id)
          .maybeSingle();

        const timezone = user?.timezone || 'Asia/Kolkata';
        const currentDay = ExerciseUnlockService.calculateCycleDay(cycle.start_date, timezone);

        // Process unlocks
        await ExerciseUnlockService.processUnlocks(cycle.user_id, cycle.id, timezone, currentDay);
      }
    } catch (err: any) {
      console.error('[ExerciseScheduler] Error unlocking eligible exercises:', err.message);
    }
  }

  /**
   * 2. Detects stale analyses stuck in 'completed', 'queued', or 'analysing' for > 15 minutes and transitions them to 'failed'.
   */
  private static async repairStaleAnalyses(): Promise<void> {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

      const { data: staleInstances, error } = await supabase
        .from('exercise_instances')
        .select('*')
        .in('status', ['completed', 'queued', 'analysing'])
        .lt('updated_at', fifteenMinutesAgo);

      if (error || !staleInstances) {
        console.error('[ExerciseScheduler] Failed to query stale instances:', error?.message);
        return;
      }

      if (staleInstances.length === 0) {
        return;
      }

      console.warn(`[ExerciseScheduler] Detected ${staleInstances.length} stale analyses. Starting repair...`);

      for (const inst of staleInstances) {
        console.warn(`[ExerciseScheduler] Repairing stale instance ${inst.id} (user ${inst.user_id}). Transitioning to failed.`);
        
        await ExerciseLifecycleManager.transitionTo(inst.user_id, inst.id, 'failed', {
          force: true,
          transitionReason: 'Analysis execution timed out (stale state detected).'
        });
      }
    } catch (err: any) {
      console.error('[ExerciseScheduler] Error repairing stale analyses:', err.message);
    }
  }

  /**
   * 3. Retries failed analyses automatically up to a maximum of 3 attempts.
   */
  private static async retryFailedAnalyses(): Promise<void> {
    try {
      const { data: failedInstances, error } = await supabase
        .from('exercise_instances')
        .select('*')
        .eq('status', 'failed');

      if (error || !failedInstances) {
        console.error('[ExerciseScheduler] Failed to query failed instances:', error?.message);
        return;
      }

      for (const inst of failedInstances) {
        // Count failure attempts from exercise_events trace log
        const { count, error: countErr } = await supabase
          .from('exercise_events')
          .select('id', { count: 'exact', head: true })
          .eq('instance_id', inst.id)
          .eq('event_type', 'failed');

        if (countErr) {
          console.error(`[ExerciseScheduler] Error counting failed events for ${inst.id}:`, countErr.message);
          continue;
        }

        const failureCount = count || 0;

        if (failureCount >= 3) {
          console.warn(`[ExerciseScheduler] Instance ${inst.id} has failed ${failureCount} times. Bypassing auto-retry.`);
          continue;
        }

        console.log(`[ExerciseScheduler] Auto-retrying failed analysis for instance ${inst.id} (attempt ${failureCount + 1})...`);

        // Transition back to queued
        await ExerciseLifecycleManager.transitionTo(inst.user_id, inst.id, 'queued', {
          force: true,
          transitionReason: `Auto-retry attempt ${failureCount + 1}`
        });

        // Enqueue background processing job
        const jobId = await IntelligenceOrchestrator.enqueueJob(inst.user_id, 'exercise', `ExerciseAutoRetry:${inst.id}`);
        await queueRegistry.addJob('exercise_processing', `exercise_retry_${inst.id}`, {
          instance_id: inst.id,
          exercise_id: inst.exercise_id,
          user_id: inst.user_id,
          cycle_id: inst.cycle_id,
          orchestrator_job_id: jobId
        });
      }
    } catch (err: any) {
      console.error('[ExerciseScheduler] Error retrying failed analyses:', err.message);
    }
  }
}
