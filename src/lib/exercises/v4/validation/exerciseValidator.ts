import { ExerciseLifecycleStatus, ExerciseDefinition, ExerciseInstance, ExerciseResponse, ExerciseResult } from '../types/exercise.types';

export const ALLOWED_TRANSITIONS: Record<ExerciseLifecycleStatus, ExerciseLifecycleStatus[]> = {
  locked: ['available'],
  available: ['started', 'in_progress', 'submitted', 'processing'],
  started: ['in_progress', 'submitted', 'processing', 'completed'],
  in_progress: ['submitted', 'processing', 'completed'],
  submitted: ['processing', 'completed'],
  processing: ['completed'],
  completed: [] // Terminal state
};

export class ExerciseValidator {
  /**
   * Validates if a state transition from `fromStatus` to `toStatus` is allowed.
   */
  public static isValidTransition(fromStatus: ExerciseLifecycleStatus, toStatus: ExerciseLifecycleStatus): boolean {
    if (fromStatus === toStatus) return true;
    const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
    return allowed.includes(toStatus);
  }

  /**
   * Enforces valid state transition, throwing error if illegal.
   */
  public static validateTransition(fromStatus: ExerciseLifecycleStatus, toStatus: ExerciseLifecycleStatus): void {
    if (!this.isValidTransition(fromStatus, toStatus)) {
      throw new Error(`Invalid Exercise V4 lifecycle transition from "${fromStatus}" to "${toStatus}". Allowed next statuses: [${(ALLOWED_TRANSITIONS[fromStatus] || []).join(', ')}]`);
    }
  }

  /**
   * Validates Exercise Definition payload.
   */
  public static validateDefinition(def: Partial<ExerciseDefinition>): void {
    if (!def.id || typeof def.id !== 'string') {
      throw new Error('Exercise definition must have a valid string "id".');
    }
    if (!def.exercise_type || typeof def.exercise_type !== 'string') {
      throw new Error('Exercise definition must have a valid string "exercise_type".');
    }
    if (!def.title || typeof def.title !== 'string') {
      throw new Error('Exercise definition must have a valid string "title".');
    }
  }

  /**
   * Validates Exercise Response payload.
   */
  public static validateResponse(resp: Partial<ExerciseResponse>): void {
    if (!resp.instance_id) {
      throw new Error('Exercise response must include "instance_id".');
    }
    if (!resp.user_id) {
      throw new Error('Exercise response must include "user_id".');
    }
  }

  /**
   * Validates Exercise Result payload.
   */
  public static validateResult(res: Partial<ExerciseResult>): void {
    if (!res.instance_id) {
      throw new Error('Exercise result must include "instance_id".');
    }
    if (!res.user_id) {
      throw new Error('Exercise result must include "user_id".');
    }
  }
}
