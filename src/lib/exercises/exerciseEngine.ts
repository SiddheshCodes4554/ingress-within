import { supabase } from '../db';
import { queueRegistry } from '../queue/registry';
import { IntelligenceOrchestrator } from '../orchestrator/intelligenceOrchestrator';

export interface ExerciseDefinition {
  id: string;
  exercise_type: string;
  unlock_rules: {
    strategy: 'immediate' | 'day_milestone' | 'weekly' | 'monthly' | 'branch' | 'knowledge_trigger' | 'pattern_trigger' | 'assessment_trigger' | 'manual';
    day?: number;
    week?: number;
    month?: number;
    branch?: string;
    pattern_name?: string;
    knowledge_dimension?: string;
    threshold?: number;
  };
  cycle: number;
  branch: string | null;
  frequency: string;
  estimated_duration: number;
  provider_version: string;
  prompt_version: string;
  active_status: boolean;
}

export interface ExerciseInstance {
  id: string;
  user_id: string;
  exercise_id: string;
  cycle_id: string | null;
  status: 'locked' | 'available' | 'started' | 'completed' | 'analysing' | 'finished' | 'failed' | 'archived';
  locked: boolean;
  available: boolean;
  started: boolean;
  completed: boolean;
  expired: boolean;
  unlock_time: string | null;
  start_time: string | null;
  completion_time: string | null;
  version: string;
}

export class ExerciseEngine {
  /**
   * Log an exercise event to exercise_events table.
   */
  public static async logEvent(
    userId: string,
    instanceId: string,
    eventType: 'locked' | 'unlocked' | 'started' | 'resumed' | 'completed' | 'analysis_started' | 'analysis_completed' | 'failed' | 'rebuilt',
    payload: any = {}
  ): Promise<void> {
    await supabase.from('exercise_events').insert({
      instance_id: instanceId,
      user_id: userId,
      event_type: eventType,
      payload
    });
  }

  /**
   * Evaluates unlock criteria for all active exercise definitions and creates instances.
   */
  public static async determineUnlockState(
    userId: string,
    cycleId: string,
    currentDay: number
  ): Promise<ExerciseInstance[]> {
    console.log(`[ExerciseEngine] Evaluating unlock state for user ${userId}, day ${currentDay}`);

    // 1. Fetch all active exercise definitions
    const { data: definitions, error: defErr } = await supabase
      .from('exercise_definitions')
      .select('*')
      .eq('active_status', true);

    if (defErr || !definitions) {
      console.error('[ExerciseEngine] Failed to fetch exercise definitions:', defErr?.message);
      return [];
    }

    // 2. Fetch existing instances for user in the current cycle
    const { data: existingInstances, error: instErr } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId);

    if (instErr) {
      console.error('[ExerciseEngine] Failed to fetch user exercise instances:', instErr.message);
      return [];
    }

    const existingIds = new Set(existingInstances?.map(inst => inst.exercise_id) || []);
    const newlyUnlocked: ExerciseInstance[] = [];

    for (const def of definitions) {
      if (existingIds.has(def.id)) {
        continue; // Already processed for this cycle
      }

      const rules = def.unlock_rules || {};
      let shouldUnlock = false;

      switch (rules.strategy) {
        case 'immediate':
          shouldUnlock = true;
          break;
        case 'day_milestone':
          if (rules.day && currentDay >= rules.day) {
            shouldUnlock = true;
          }
          break;
        case 'manual':
          // Requires admin action
          shouldUnlock = false;
          break;
        default:
          shouldUnlock = false;
          break;
      }

      if (shouldUnlock) {
        const { data: instance, error: createErr } = await supabase
          .from('exercise_instances')
          .insert({
            user_id: userId,
            exercise_id: def.id,
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

        if (createErr || !instance) {
          console.error(`[ExerciseEngine] Failed to create instance for ${def.id}:`, createErr?.message);
        } else {
          console.log(`[ExerciseEngine] Unlocked exercise: ${def.id} for user ${userId}`);
          newlyUnlocked.push(instance as ExerciseInstance);
          await this.logEvent(userId, instance.id, 'unlocked', { strategy: rules.strategy });
        }
      }
    }

    return newlyUnlocked;
  }

  /**
   * Retrieves active or available exercise instance, or triggers unlock check.
   * STRICTLY READ-ONLY for Normal GETs.
   */
  public static async getOrUnlockCurrentExercise(
    userId: string,
    cycleId: string,
    currentDay: number
  ): Promise<ExerciseInstance | null> {
    // 1. Query existing started or available instances
    const { data: instances, error } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId)
      .in('status', ['started', 'available'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ExerciseEngine] Error querying current exercise:', error.message);
      return null;
    }

    if (instances && instances.length > 0) {
      // Prioritize started one
      const started = instances.find(inst => inst.status === 'started');
      return (started || instances[0]) as ExerciseInstance;
    }

    return null;
  }

  /**
   * Starts an unlocked/available exercise instance.
   */
  public static async startExercise(userId: string, instanceId: string): Promise<ExerciseInstance> {
    const { data: instance, error: fetchErr } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !instance) {
      throw new Error(`Instance not found: ${fetchErr?.message || 'Unauthorized'}`);
    }

    if (instance.status !== 'available' && instance.status !== 'locked') {
      // If already started or completed, return as is
      return instance as ExerciseInstance;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('exercise_instances')
      .update({
        status: 'started',
        locked: false,
        available: true,
        started: true,
        start_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (updateErr || !updated) {
      throw new Error(`Failed to start exercise: ${updateErr?.message}`);
    }

    await this.logEvent(userId, instanceId, 'started');
    return updated as ExerciseInstance;
  }

  /**
   * Saves intermediate progress response answer.
   */
  public static async saveProgress(
    userId: string,
    instanceId: string,
    questionId: string,
    stepId: string,
    response: any,
    metadata: any = {}
  ): Promise<void> {
    // 1. Confirm instance state
    const { data: instance } = await supabase
      .from('exercise_instances')
      .select('status')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (!instance || (instance.status !== 'started' && instance.status !== 'available')) {
      throw new Error('Exercise is not in an active/started state.');
    }

    // 2. Upsert response
    const { error } = await supabase
      .from('exercise_responses')
      .upsert({
        instance_id: instanceId,
        user_id: userId,
        question_id: questionId,
        step_id: stepId,
        response,
        metadata,
        created_at: new Date().toISOString()
      }, { onConflict: 'instance_id,question_id' });

    if (error) {
      throw new Error(`Failed to save step response: ${error.message}`);
    }

    // Keep instance updated timestamp fresh
    await supabase
      .from('exercise_instances')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', instanceId);
  }

  /**
   * Resumes a partially completed exercise instance.
   */
  public static async resumeExercise(
    userId: string,
    instanceId: string
  ): Promise<{ instance: ExerciseInstance; responses: any[] }> {
    const { data: instance, error } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (error || !instance) {
      throw new Error(`Instance not found or unauthorized: ${error?.message || ''}`);
    }

    // Fetch existing responses
    const { data: responses } = await supabase
      .from('exercise_responses')
      .select('*')
      .eq('instance_id', instanceId);

    // If status was available, set to started/resumed
    if (instance.status === 'available') {
      const { data: resumedInstance } = await supabase
        .from('exercise_instances')
        .update({
          status: 'started',
          started: true,
          start_time: instance.start_time || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId)
        .select()
        .single();

      await this.logEvent(userId, instanceId, 'resumed');
      return {
        instance: (resumedInstance || instance) as ExerciseInstance,
        responses: responses || []
      };
    }

    await this.logEvent(userId, instanceId, 'resumed');
    return {
      instance: instance as ExerciseInstance,
      responses: responses || []
    };
  }

  /**
   * Submits exercise and enqueues background worker job.
   */
  public static async submitExercise(userId: string, instanceId: string): Promise<void> {
    const { data: instance, error: fetchErr } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !instance) {
      throw new Error(`Instance not found: ${fetchErr?.message || 'Unauthorized'}`);
    }

    if (instance.status === 'completed' || instance.status === 'analysing' || instance.status === 'finished') {
      console.log(`[ExerciseEngine] Exercise ${instanceId} is already completed/submitted.`);
      return; // Maintain idempotency
    }

    // 1. Check completion validity (require at least one response)
    const { count, error: countErr } = await supabase
      .from('exercise_responses')
      .select('id', { count: 'exact', head: true })
      .eq('instance_id', instanceId);

    if (countErr || !count || count === 0) {
      throw new Error('Cannot submit an exercise with zero responses.');
    }

    // 2. Transition state to completed
    const { error: updateErr } = await supabase
      .from('exercise_instances')
      .update({
        status: 'completed',
        completed: true,
        completion_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (updateErr) {
      throw new Error(`Failed to submit exercise: ${updateErr.message}`);
    }

    await this.logEvent(userId, instanceId, 'completed');

    // 3. Queue analysis job
    const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'exercise', `ExerciseCompleted:${instanceId}`);
    await queueRegistry.addJob('exercise_processing', `exercise_${instanceId}`, {
      instance_id: instanceId,
      exercise_id: instance.exercise_id,
      user_id: userId,
      cycle_id: instance.cycle_id,
      orchestrator_job_id: jobId
    });

    console.log(`[ExerciseEngine] Successfully submitted and queued background analysis for exercise instance ${instanceId}`);
  }

  /**
   * Gets history of completed exercises.
   */
  public static async getExerciseHistory(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('exercise_instances')
      .select('*, definition:exercise_definitions(*)')
      .eq('user_id', userId)
      .in('status', ['finished', 'completed'])
      .order('completion_time', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch exercise history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Gets status/unlock matrices for all definitions.
   */
  public static async getExerciseStatus(userId: string, cycleId: string): Promise<any[]> {
    const { data: definitions, error: defErr } = await supabase
      .from('exercise_definitions')
      .select('*')
      .eq('active_status', true);

    if (defErr) {
      throw new Error(`Failed to fetch definitions: ${defErr.message}`);
    }

    const { data: instances, error: instErr } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId);

    if (instErr) {
      throw new Error(`Failed to fetch instances: ${instErr.message}`);
    }

    return definitions.map(def => {
      const inst = instances?.find(i => i.exercise_id === def.id);
      return {
        definition: def,
        instance: inst || null,
        status: inst ? inst.status : 'locked'
      };
    });
  }

  /**
   * Retrieves evaluation result for finished instance.
   */
  public static async getExerciseResult(userId: string, instanceId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('exercise_results')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch exercise result: ${error.message}`);
    }

    return data;
  }

  /**
   * Performs administrative manual state machine override actions.
   */
  public static async adminAction(
    userId: string,
    action: 'unlock' | 'complete' | 'rebuild' | 'retry' | 'archive',
    params: { exerciseId?: string; instanceId?: string; cycleId?: string }
  ): Promise<any> {
    console.log(`[ExerciseEngine] [ADMIN] Running action ${action} for user ${userId}`, params);

    switch (action) {
      case 'unlock': {
        const { exerciseId, cycleId } = params;
        if (!exerciseId || !cycleId) throw new Error('Missing exerciseId or cycleId');

        // Check active definition
        const { data: def } = await supabase
          .from('exercise_definitions')
          .select('*')
          .eq('id', exerciseId)
          .single();

        if (!def) throw new Error(`Definition not found: ${exerciseId}`);

        // Insert new available instance
        const { data: instance, error } = await supabase
          .from('exercise_instances')
          .insert({
            user_id: userId,
            exercise_id: exerciseId,
            cycle_id: cycleId,
            status: 'available',
            locked: false,
            available: true,
            unlock_time: new Date().toISOString()
          })
          .select()
          .single();

        if (error || !instance) throw new Error(`Failed to unlock manually: ${error?.message}`);

        await this.logEvent(userId, instance.id, 'unlocked', { admin: true });
        return { success: true, instance };
      }

      case 'complete': {
        const { instanceId } = params;
        if (!instanceId) throw new Error('Missing instanceId');

        // Transition to completed
        const { data: updated, error } = await supabase
          .from('exercise_instances')
          .update({
            status: 'completed',
            completed: true,
            completion_time: new Date().toISOString()
          })
          .eq('id', instanceId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error || !updated) throw new Error(`Failed to manually complete: ${error?.message}`);

        await this.logEvent(userId, instanceId, 'completed', { admin: true });
        return { success: true, instance: updated };
      }

      case 'retry':
      case 'rebuild': {
        const { instanceId } = params;
        if (!instanceId) throw new Error('Missing instanceId');

        const { data: instance } = await supabase
          .from('exercise_instances')
          .select('*')
          .eq('id', instanceId)
          .single();

        if (!instance) throw new Error('Instance not found');

        // Transition to analysing and enqueue
        await supabase
          .from('exercise_instances')
          .update({ status: 'completed' })
          .eq('id', instanceId);

        await this.logEvent(userId, instanceId, 'rebuilt', { admin: true });

        const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'exercise', `ExerciseRebuilt:${instanceId}`);
        await queueRegistry.addJob('exercise_processing', `exercise_rebuild_${instanceId}`, {
          instance_id: instanceId,
          exercise_id: instance.exercise_id,
          user_id: userId,
          cycle_id: instance.cycle_id,
          orchestrator_job_id: jobId
        });

        return { success: true, status: 'queued_rebuild' };
      }

      case 'archive': {
        const { instanceId } = params;
        if (!instanceId) throw new Error('Missing instanceId');

        const { data: updated, error } = await supabase
          .from('exercise_instances')
          .update({ status: 'archived' })
          .eq('id', instanceId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error || !updated) throw new Error(`Failed to archive: ${error?.message}`);

        return { success: true, instance: updated };
      }

      default:
        throw new Error(`Unsupported admin action: ${action}`);
    }
  }
}
