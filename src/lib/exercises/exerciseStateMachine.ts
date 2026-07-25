import { supabase } from '../db';

export type ExerciseStatus = 
  | 'locked'
  | 'available'
  | 'started'
  | 'in_progress'
  | 'submitted'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'result_available'
  | 'failed'
  | 'archived';

const ALLOWED_TRANSITIONS: Record<ExerciseStatus, ExerciseStatus[]> = {
  locked: ['available'],
  available: ['started', 'in_progress'],
  started: ['in_progress', 'submitted'],
  in_progress: ['submitted'],
  submitted: ['queued', 'failed'],
  queued: ['processing', 'failed'],
  processing: ['completed', 'failed'],
  completed: ['result_available', 'failed'],
  result_available: ['archived'],
  failed: ['queued', 'processing', 'archived'],
  archived: []
};

export class ExerciseStateMachine {
  /**
   * Validates whether a state transition is legal according to the state machine.
   */
  public static isValidTransition(from: ExerciseStatus, to: ExerciseStatus, isForce: boolean = false): boolean {
    if (from === to) return true; // Idempotent same-state check
    if (isForce) return true; // Admin or system repair override
    const allowed = ALLOWED_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * Performs an atomic transition of an exercise instance status.
   * Logs transition event into exercise_events.
   */
  public static async transition(
    userId: string,
    instanceId: string,
    newStatus: ExerciseStatus,
    options: {
      reason?: string;
      payload?: Record<string, any>;
      force?: boolean;
    } = {}
  ): Promise<{ success: boolean; instance?: any; error?: string }> {
    if (!userId || !instanceId || !newStatus) {
      return { success: false, error: 'Missing required parameters for state transition.' };
    }

    // 1. Fetch current instance with user boundary filter
    const { data: current, error: fetchErr } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchErr || !current) {
      return { success: false, error: `Instance not found or unauthorized: ${fetchErr?.message || ''}` };
    }

    const currentStatus = current.status as ExerciseStatus;

    // 2. Validate state machine transition
    if (!this.isValidTransition(currentStatus, newStatus, options.force)) {
      const err = `Invalid transition from state "${currentStatus}" to "${newStatus}" for instance ${instanceId}`;
      console.error(`[StateMachine] ${err}`);
      return { success: false, error: err };
    }

    // 3. Prepare timestamps based on target state
    const now = new Date().toISOString();
    const updateFields: Record<string, any> = {
      status: newStatus,
      updated_at: now
    };

    if (newStatus === 'started' || newStatus === 'in_progress') {
      if (!current.started_at && !current.start_time) {
        updateFields.started_at = now;
        updateFields.start_time = now;
      }
    } else if (newStatus === 'submitted') {
      updateFields.submitted_at = now;
    } else if (newStatus === 'completed') {
      updateFields.completed_at = now;
      updateFields.completion_time = now;
    } else if (newStatus === 'result_available') {
      updateFields.analysis_completed_at = now;
    }

    // 4. Update exercise_instances
    const { data: updated, error: updateErr } = await supabase
      .from('exercise_instances')
      .update(updateFields)
      .eq('id', instanceId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateErr || !updated) {
      console.error(`[StateMachine] Update failed for instance ${instanceId}:`, updateErr?.message);
      return { success: false, error: `Database update failed: ${updateErr?.message}` };
    }

    // 5. Emit event to exercise_events table
    try {
      await supabase.from('exercise_events').insert({
        instance_id: instanceId,
        user_id: userId,
        event_type: newStatus,
        payload: {
          previous_status: currentStatus,
          new_status: newStatus,
          reason: options.reason || 'State machine transition',
          ...(options.payload || {})
        }
      });
    } catch (evtErr: any) {
      console.warn(`[StateMachine] Event log non-fatal error:`, evtErr.message);
    }

    console.log(`[StateMachine] Instance ${instanceId} transitioned: ${currentStatus} -> ${newStatus}`);
    return { success: true, instance: updated };
  }
}
