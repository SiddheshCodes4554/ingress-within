import { ExerciseLifecycleStatus, ExerciseInstance } from '../types/exercise.types';
import { ExerciseValidator } from '../validation/exerciseValidator';
import { ExerciseRepository } from '../repository/exerciseRepository';

const EVENT_TYPE_MAP: Record<ExerciseLifecycleStatus, string> = {
  locked: 'unlocked',
  available: 'unlocked',
  started: 'started',
  in_progress: 'started',
  submitted: 'completed',
  processing: 'started',
  completed: 'completed'
};

export class ExerciseLifecycleService {
  /**
   * Transitions an exercise instance to a new target status according to strict V4 lifecycle rules.
   */
  public static async transitionTo(
    instanceId: string,
    targetStatus: ExerciseLifecycleStatus,
    payload?: Record<string, any>
  ): Promise<ExerciseInstance> {
    const instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      throw new Error(`[ExerciseLifecycleService] Instance not found: ${instanceId}`);
    }

    // 1. Validate status transition
    ExerciseValidator.validateTransition(instance.status, targetStatus);

    // 2. Prepare timestamp updates depending on target state
    const now = new Date().toISOString();
    const extraFields: Partial<ExerciseInstance> = {};

    if (targetStatus === 'available' && !instance.unlock_time) {
      extraFields.unlock_time = now;
    } else if (targetStatus === 'started' && !instance.started_at) {
      extraFields.started_at = now;
    } else if (targetStatus === 'submitted') {
      extraFields.submitted_at = now;
    } else if (targetStatus === 'completed') {
      extraFields.completed_at = now;
    }

    // 3. Update database record
    const updatedInstance = await ExerciseRepository.updateInstanceStatus(instanceId, targetStatus, extraFields);

    // 4. Log lifecycle event to database with DB constraint-compliant event_type
    const dbEventType = EVENT_TYPE_MAP[targetStatus] || 'started';
    await ExerciseRepository.recordEvent({
      instance_id: instanceId,
      userId: instance.user_id,
      eventType: dbEventType,
      payload: {
        previous_status: instance.status,
        new_status: targetStatus,
        exercise_id: instance.exercise_id,
        ...payload
      }
    });

    console.log(`[ExerciseLifecycleService] Instance ${instanceId} (${instance.exercise_id}): ${instance.status} -> ${targetStatus}`);
    return updatedInstance;
  }
}
