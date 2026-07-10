import { supabase } from '../db';

export interface OrchestratorEvent {
  id?: string;
  user_id: string;
  event_type: string;
  payload: any;
  created_at?: string;
}

export interface OrchestratorJob {
  id?: string;
  user_id: string;
  engine: string;
  trigger: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  queued_at?: string;
  started_at?: string;
  completed_at?: string;
  attempts: number;
  last_error?: string;
}

export interface EngineState {
  user_id: string;
  engine_name: string;
  last_generated?: string;
  last_processed_entry?: string;
  last_processed_week?: number;
  status: string;
  next_action?: string;
  engine_version: string;
  next_due?: string | null;
  last_error?: string | null;
  attempts?: number;
  duration?: number | null;
}

export interface EngineHealth {
  engine: string;
  status: 'Healthy' | 'Waiting' | 'Queued' | 'Processing' | 'Failed' | 'Needs Repair' | 'Stale';
  last_generated: string | null;
  next_due: string | null;
  last_error: string | null;
  attempts: number;
  duration: number | null;
}

export class IntelligenceOrchestrator {
  /**
   * Emits a platform event, logs it to database, and determines if it triggers any jobs.
   */
  public static async emitEvent(userId: string, eventType: string, payload: any = {}): Promise<void> {
    console.log(`[Orchestrator] Emitting event: "${eventType}" for user ${userId}`);

    // 1. Write event to DB
    const { error: eventErr } = await supabase
      .from('orchestrator_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        payload
      });

    if (eventErr) {
      console.error(`[Orchestrator] Failed to log event "${eventType}":`, eventErr.message);
      throw eventErr;
    }

    // 2. Evaluate coordination triggers
    await this.evaluateTriggers(userId, eventType, payload);
  }

  /**
   * Enqueues a job for a specific engine.
   */
  public static async enqueueJob(userId: string, engine: string, triggerEvent: string): Promise<string> {
    console.log(`[Orchestrator] Enqueueing job for engine: "${engine}" (triggered by: "${triggerEvent}")`);

    const { data: job, error: jobErr } = await supabase
      .from('orchestrator_jobs')
      .insert({
        user_id: userId,
        engine,
        trigger: triggerEvent,
        status: 'queued',
        attempts: 0
      })
      .select('id')
      .single();

    if (jobErr || !job) {
      console.error(`[Orchestrator] Failed to enqueue job for "${engine}":`, jobErr?.message);
      throw jobErr || new Error('Job creation failed.');
    }

    return job.id;
  }

  /**
   * Transitions a job state to running.
   */
  public static async startJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('orchestrator_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (error) {
      console.error(`[Orchestrator] Failed to start job ${jobId}:`, error.message);
      throw error;
    }
  }

  /**
   * Transitions a job state to completed and updates corresponding engine state.
   */
  public static async completeJob(
    jobId: string, 
    userId: string, 
    engine: string, 
    meta: { lastProcessedEntry?: string; lastProcessedWeek?: number } = {}
  ): Promise<void> {
    const now = new Date().toISOString();

    // Fetch started_at to calculate duration
    const { data: job } = await supabase
      .from('orchestrator_jobs')
      .select('started_at')
      .eq('id', jobId)
      .maybeSingle();

    const duration = job?.started_at
      ? Date.now() - new Date(job.started_at).getTime()
      : null;

    const { error: jobErr } = await supabase
      .from('orchestrator_jobs')
      .update({
        status: 'completed',
        completed_at: now
      })
      .eq('id', jobId);

    if (jobErr) {
      console.error(`[Orchestrator] Failed to complete job ${jobId}:`, jobErr.message);
      throw jobErr;
    }

    // Set next due date for scheduled maintenance crons (e.g. daily/weekly checks)
    let nextDue: string | null = null;
    if (engine === 'knowledge' || engine === 'vocabulary') {
      nextDue = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hour interval
    }

    // Update engine state to reflect completion
    await this.updateEngineState(userId, engine, {
      status: 'Healthy',
      last_generated: now,
      last_processed_entry: meta.lastProcessedEntry || undefined,
      last_processed_week: meta.lastProcessedWeek || undefined,
      next_action: 'awaiting_trigger',
      next_due: nextDue,
      last_error: null,
      attempts: 0,
      duration: duration || undefined
    });
  }

  /**
   * Handles job failure, increments attempt counter, and schedules retry or marks failed.
   */
  public static async failJob(jobId: string, userId: string, engine: string, errorMsg: string): Promise<void> {
    const { data: job } = await supabase
      .from('orchestrator_jobs')
      .select('attempts, trigger')
      .eq('id', jobId)
      .single();

    const nextAttempts = (job?.attempts || 0) + 1;
    const status = nextAttempts >= 3 ? 'failed' : 'queued'; // failed after 3 retries (transient failure threshold)

    await supabase
      .from('orchestrator_jobs')
      .update({
        status,
        attempts: nextAttempts,
        last_error: errorMsg
      })
      .eq('id', jobId);

    const engineStatus = status === 'failed' ? 'Failed' : 'Queued';
    const nextAction = status === 'failed' ? 'manual_intervention' : 'queued_for_retry';

    await this.updateEngineState(userId, engine, {
      status: engineStatus,
      next_action: nextAction,
      last_error: errorMsg,
      attempts: nextAttempts
    });

    if (status === 'queued' && job) {
      console.log(`[Orchestrator] Retrying job ${jobId} for engine ${engine} (attempt ${nextAttempts}/3)...`);
      try {
        await this.reQueueJob(userId, engine, job.trigger, jobId);
      } catch (err: any) {
        console.error(`[Orchestrator] Failed to automatically re-queue job ${jobId}:`, err.message);
      }
    } else if (status === 'failed') {
      console.warn(`[Orchestrator] Job ${jobId} for engine ${engine} failed permanently after 3 attempts.`);
    }

    // Emit failure event
    await supabase.from('orchestrator_events').insert({
      user_id: userId,
      event_type: status === 'failed' ? 'WorkerFailed' : 'WorkerRetried',
      payload: { job_id: jobId, engine, attempts: nextAttempts, error: errorMsg }
    });
  }

  /**
   * Re-queues a failed job for automatic retry execution.
   */
  private static async reQueueJob(userId: string, engine: string, triggerKey: string, jobId: string): Promise<void> {
    const parts = triggerKey.split(':');
    const resourceId = parts[1] || '';
    const { queueRegistry } = await import('../queue/registry');

    switch (engine) {
      case 'crisis_detection':
        await queueRegistry.addJob('crisis_detection', `crisis_retry_${resourceId}_${Date.now()}`, {
          entry_id: resourceId,
          user_id: userId,
          orchestrator_job_id: jobId
        });
        break;
      case 'reflection':
        await queueRegistry.addJob('reflection_generation', `refl_retry_${resourceId}_${Date.now()}`, {
          entry_id: resourceId,
          user_id: userId,
          orchestrator_job_id: jobId
        });
        break;
      case 'vocabulary':
        await queueRegistry.addJob('vocab_processing', `vocab_retry_${resourceId}_${Date.now()}`, {
          entry_id: resourceId,
          user_id: userId,
          orchestrator_job_id: jobId
        });
        break;
      case 'weekly_report': {
        const { data: summary } = await supabase
          .from('weekly_summaries')
          .select('cycle_id, week_number')
          .eq('id', resourceId)
          .maybeSingle();
        if (summary) {
          await queueRegistry.addJob('weekly_summary_generation', `weekly_validate_retry_${resourceId}_${Date.now()}`, {
            summary_id: resourceId,
            cycle_id: summary.cycle_id,
            user_id: userId,
            week_number: summary.week_number,
            is_validation_job: true,
            orchestrator_job_id: jobId
          });
        }
        break;
      }
      case 'patterns': {
        const source_type = triggerKey.startsWith('WeeklyReportCompleted') ? 'weekly_report' : 'journal';
        const { data: entry } = await supabase
          .from('entries')
          .select('cycle_id')
          .eq('id', resourceId)
          .maybeSingle();
        const cycle_id = entry?.cycle_id || 'global';
        await queueRegistry.addJob('pattern_processing', `pattern_retry_${resourceId}_${Date.now()}`, {
          entry_id: resourceId,
          user_id: userId,
          cycle_id,
          source_type,
          orchestrator_job_id: jobId
        });
        break;
      }
      case 'knowledge':
        await queueRegistry.addJob('knowledge_processing', `knowledge_event_retry_${resourceId}_${Date.now()}`, {
          event_id: resourceId,
          user_id: userId,
          orchestrator_job_id: jobId
        });
        break;
      case 'assessment': {
        const { data: ass } = await supabase
          .from('assessments')
          .select('cycle_id')
          .eq('id', resourceId)
          .maybeSingle();
        if (ass) {
          await queueRegistry.addJob('monthly_report_generation', `assessment_retry_${resourceId}_${Date.now()}`, {
            cycle_id: ass.cycle_id,
            user_id: userId,
            assessment_id: resourceId,
            month_number: 1,
            orchestrator_job_id: jobId
          });
        }
        break;
      }
      case 'exercise':
        await queueRegistry.addJob('exercise_insight_generation', `exercise_retry_${resourceId}_${Date.now()}`, {
          exercise_id: resourceId,
          user_id: userId,
          orchestrator_job_id: jobId
        });
        break;
    }
  }

  /**
   * Dynamically evaluates and exposes an engine's current health metrics.
   */
  public static async getEngineHealth(userId: string, engineName: string): Promise<EngineHealth> {
    const state = await this.getEngineState(userId, engineName);

    // Retrieve the latest orchestrator job matching this engine
    const { data: latestJob } = await supabase
      .from('orchestrator_jobs')
      .select('status, started_at, attempts, last_error')
      .eq('user_id', userId)
      .eq('engine', engineName)
      .order('queued_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let healthStatus: EngineHealth['status'] = 'Waiting';

    if (state?.status) {
      if (state.status === 'Healthy' || state.status === 'idle') {
        healthStatus = 'Healthy';
      } else if (state.status === 'Failed' || state.status === 'error') {
        healthStatus = 'Failed';
      } else if (state.status === 'Needs Repair') {
        healthStatus = 'Needs Repair';
      } else if (state.status === 'Stale') {
        healthStatus = 'Stale';
      }
    }

    if (latestJob) {
      if (latestJob.status === 'queued') {
        healthStatus = 'Queued';
      } else if (latestJob.status === 'running') {
        // Stuck job detection (longer than 5 minutes running time)
        const runtime = Date.now() - new Date(latestJob.started_at).getTime();
        if (runtime > 5 * 60 * 1000) {
          healthStatus = 'Needs Repair';
        } else {
          healthStatus = 'Processing';
        }
      } else if (latestJob.status === 'failed') {
        healthStatus = latestJob.attempts >= 3 ? 'Needs Repair' : 'Failed';
      }
    }

    return {
      engine: engineName,
      status: healthStatus,
      last_generated: state?.last_generated || null,
      next_due: state?.next_due || null,
      last_error: state?.last_error || latestJob?.last_error || null,
      attempts: state?.attempts || latestJob?.attempts || 0,
      duration: state?.duration || null
    };
  }

  /**
   * Gets the state of a specific engine for a user.
   */
  public static async getEngineState(userId: string, engineName: string): Promise<any> {
    const { data: state, error } = await supabase
      .from('engine_state')
      .select('*')
      .eq('user_id', userId)
      .eq('engine_name', engineName)
      .maybeSingle();

    if (error) {
      console.error(`[Orchestrator] Error fetching engine state for "${engineName}":`, error.message);
    }

    return state;
  }

  /**
   * Updates or inserts the state of an engine for a user.
   */
  public static async updateEngineState(userId: string, engineName: string, updates: Partial<EngineState>): Promise<void> {
    // Read current state to merge columns safely if columns might be missing
    const currentState = await this.getEngineState(userId, engineName);

    const payload: any = {
      user_id: userId,
      engine_name: engineName,
      status: updates.status || currentState?.status || 'idle',
      last_generated: updates.last_generated !== undefined ? updates.last_generated : (currentState?.last_generated || null),
      last_processed_entry: updates.last_processed_entry !== undefined ? updates.last_processed_entry : (currentState?.last_processed_entry || null),
      last_processed_week: updates.last_processed_week !== undefined ? updates.last_processed_week : (currentState?.last_processed_week || null),
      next_action: updates.next_action !== undefined ? updates.next_action : (currentState?.next_action || null),
      engine_version: updates.engine_version || currentState?.engine_version || '1.0'
    };

    // Safely check and add new columns if they exist in schema or if we want to write them.
    // Supabase will ignore columns not in the schema, but we want to log updates to them.
    if ('next_due' in updates || currentState?.next_due !== undefined) {
      payload.next_due = updates.next_due !== undefined ? updates.next_due : (currentState?.next_due || null);
    }
    if ('last_error' in updates || currentState?.last_error !== undefined) {
      payload.last_error = updates.last_error !== undefined ? updates.last_error : (currentState?.last_error || null);
    }
    if ('attempts' in updates || currentState?.attempts !== undefined) {
      payload.attempts = updates.attempts !== undefined ? updates.attempts : (currentState?.attempts || 0);
    }
    if ('duration' in updates || currentState?.duration !== undefined) {
      payload.duration = updates.duration !== undefined ? updates.duration : (currentState?.duration || null);
    }

    const { error } = await supabase
      .from('engine_state')
      .upsert(payload, { onConflict: 'user_id,engine_name' });

    if (error) {
      console.warn(`[Orchestrator] Failed updating engine state for "${engineName}". If schema hasn't been migrated yet, this is expected:`, error.message);
      // Fallback: update without health columns
      const fallbackPayload = {
        user_id: userId,
        engine_name: engineName,
        status: payload.status,
        last_generated: payload.last_generated,
        last_processed_entry: payload.last_processed_entry,
        last_processed_week: payload.last_processed_week,
        next_action: payload.next_action,
        engine_version: payload.engine_version
      };
      const { error: fallbackErr } = await supabase
        .from('engine_state')
        .upsert(fallbackPayload, { onConflict: 'user_id,engine_name' });

      if (fallbackErr) {
        console.error(`[Orchestrator] Fallback update failed:`, fallbackErr.message);
        throw fallbackErr;
      }
    }
  }

  /**
   * Determines next orchestrator jobs to queue based on the emitted event.
   * Centralizes all pipeline routing triggers.
   */
  private static async evaluateTriggers(userId: string, eventType: string, payload: any): Promise<void> {
    const resourceId = payload.entry_id || payload.weekly_summary_id || payload.event_id || payload.thread_response_id || 'global';
    const triggerKey = `${eventType}:${resourceId}`;
    
    // Idempotency: Check if the event was already logged and handled
    const { data: existingJobs } = await supabase
      .from('orchestrator_jobs')
      .select('id, status')
      .eq('user_id', userId)
      .eq('trigger', triggerKey);

    if (existingJobs && existingJobs.some(j => j.status === 'completed' || j.status === 'running')) {
      console.log(`[Orchestrator] Duplicate event trigger ignored for idempotency: "${triggerKey}"`);
      return;
    }

    const { ORCHESTRATION_RULES } = await import('./rulesEngine');
    const { queueRegistry } = await import('../queue/registry');

    // Create execution context for rules
    const ctx = {
      enqueueJob: this.enqueueJob.bind(this),
      emitEvent: this.emitEvent.bind(this),
      queueRegistry
    };

    // Evaluate rules
    for (const rule of ORCHESTRATION_RULES) {
      if (rule.triggerEvent === eventType) {
        try {
          const conditionsMet = await rule.conditions(userId, payload);
          if (conditionsMet) {
            console.log(`[Orchestrator] Rule "${rule.name}" triggered.`);
            await rule.action(userId, payload, ctx);
          }
        } catch (err: any) {
          console.error(`[Orchestrator] Error evaluating rule "${rule.name}":`, err.message);
        }
      }
    }
  }
}
