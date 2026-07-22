import { supabase } from '../db';
import { ExerciseEventPublisher } from './exerciseEventPublisher';

export interface ExerciseInstanceUpdate {
  status?: 'locked' | 'available' | 'started' | 'in_progress' | 'completed' | 'queued' | 'analysing' | 'finished' | 'failed' | 'archived';
  locked?: boolean;
  available?: boolean;
  started?: boolean;
  completed?: boolean;
  expired?: boolean;
  unlock_time?: string | null;
  start_time?: string | null;
  completion_time?: string | null;
  updated_at?: string;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  locked: ['available', 'archived'],
  available: ['started', 'archived'],
  started: ['in_progress', 'completed', 'archived'],
  in_progress: ['completed', 'archived'],
  completed: ['queued', 'analysing', 'failed', 'archived'],
  queued: ['analysing', 'failed', 'archived'],
  analysing: ['finished', 'failed', 'archived'],
  finished: ['queued', 'archived'],
  failed: ['queued', 'analysing', 'archived'],
  archived: ['available', 'finished', 'started', 'in_progress']
};

export class ExerciseLifecycleManager {
  /**
   * Helper to determine boolean state flags based on the next state status.
   */
  private static determineStateFlags(status: string): Partial<ExerciseInstanceUpdate> {
    switch (status) {
      case 'locked':
        return { locked: true, available: false, started: false, completed: false };
      case 'available':
        return { locked: false, available: true, started: false, completed: false };
      case 'started':
      case 'in_progress':
        return { locked: false, available: true, started: true, completed: false };
      case 'completed':
      case 'queued':
      case 'analysing':
      case 'finished':
      case 'failed':
        return { locked: false, available: true, started: true, completed: true };
      case 'archived':
        return { locked: false };
      default:
        return {};
    }
  }

  /**
   * Safe State Transition function.
   * Validates transition path unless force flag is set.
   * Logs execution events and updates the database.
   */
  public static async transitionTo(
    userId: string,
    instanceId: string,
    nextStatus: 'locked' | 'available' | 'started' | 'in_progress' | 'completed' | 'queued' | 'analysing' | 'finished' | 'failed' | 'archived',
    options: { force?: boolean; transitionReason?: string; metadata?: any } = {}
  ): Promise<any> {
    const { force = false, transitionReason = '', metadata = {} } = options;

    console.log(`[Lifecycle] Attempting transition for instance ${instanceId} to status: ${nextStatus}`);

    // 1. Fetch current instance
    const { data: instance, error: fetchErr } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !instance) {
      throw new Error(`Exercise instance ${instanceId} not found or unauthorized. Details: ${fetchErr?.message || 'Instance null'}`);
    }

    const currentStatus = instance.status || 'locked';

    if (currentStatus === nextStatus) {
      console.log(`[Lifecycle] Instance ${instanceId} is already in state: ${nextStatus}. Skipping transition.`);
      return instance; // Maintain idempotency
    }

    // 2. Validate transitions
    if (!force) {
      const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(nextStatus)) {
        throw new Error(`Invalid state transition requested: ${currentStatus} -> ${nextStatus}`);
      }
    }

    // 3. Compute next flags and fields
    const flagsUpdate = this.determineStateFlags(nextStatus);
    const updatePayload: ExerciseInstanceUpdate = {
      ...flagsUpdate,
      status: nextStatus,
      updated_at: new Date().toISOString()
    };

    if (nextStatus === 'available' && !instance.unlock_time) {
      updatePayload.unlock_time = new Date().toISOString();
    }
    if (nextStatus === 'started' && !instance.start_time) {
      updatePayload.start_time = new Date().toISOString();
    }
    if (nextStatus === 'completed' && !instance.completion_time) {
      updatePayload.completion_time = new Date().toISOString();
    }

    // 4. Perform updates
    const { data: updatedInstance, error: updateErr } = await supabase
      .from('exercise_instances')
      .update(updatePayload)
      .eq('id', instanceId)
      .select()
      .single();

    if (updateErr || !updatedInstance) {
      throw new Error(`Lifecycle transition update failed: ${updateErr?.message}`);
    }

    // 5. Log transaction event trace
    const eventTypeMap: Record<string, any> = {
      locked: 'locked',
      available: 'unlocked',
      started: 'started',
      in_progress: 'resumed',
      completed: 'completed',
      queued: 'completed',
      analysing: 'analysis_started',
      finished: 'analysis_completed',
      failed: 'failed',
      archived: 'failed'
    };

    const eventType = eventTypeMap[nextStatus] || 'resumed';
    
    // Log trace to exercise_events table
    const logPayload = {
      previous_status: currentStatus,
      next_status: nextStatus,
      force,
      reason: transitionReason,
      metadata
    };

    await supabase.from('exercise_events').insert({
      instance_id: instanceId,
      user_id: userId,
      event_type: eventType,
      payload: logPayload
    });

    // 6. Broadcast event via publisher
    const eventPayload = {
      instance_id: instanceId,
      exercise_id: updatedInstance.exercise_id,
      cycle_id: updatedInstance.cycle_id,
      error: transitionReason || undefined
    };

    switch (nextStatus) {
      case 'available':
        await ExerciseEventPublisher.publishUnlocked(userId, eventPayload);
        break;
      case 'started':
        await ExerciseEventPublisher.publishStarted(userId, eventPayload);
        break;
      case 'completed':
        await ExerciseEventPublisher.publishCompleted(userId, eventPayload);
        break;
      case 'analysing':
        await ExerciseEventPublisher.publishAnalysisStarted(userId, eventPayload);
        break;
      case 'finished':
        await ExerciseEventPublisher.publishAnalysisCompleted(userId, eventPayload);
        break;
      case 'failed':
        await ExerciseEventPublisher.publishFailed(userId, { ...eventPayload, error: transitionReason || 'Analysis failed' });
        break;
      default:
        // No orchestrator event needed for in_progress/queued/archived/locked
        break;
    }

    console.log(`[Lifecycle] Successfully transitioned instance ${instanceId} from ${currentStatus} -> ${nextStatus}`);
    return updatedInstance;
  }
}
