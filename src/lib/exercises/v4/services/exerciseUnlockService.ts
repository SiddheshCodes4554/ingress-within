import { ExerciseRepository } from '../repository/exerciseRepository';
import { ExerciseLifecycleService } from './exerciseLifecycleService';
import { ExerciseInstance } from '../types/exercise.types';

export class ExerciseUnlockService {
  /**
   * Evaluates unlock rules for a locked exercise instance and unlocks it if eligible.
   */
  public static async evaluateUnlock(
    instanceId: string,
    context: {
      currentCycleDay: number;
      isCompletedCycle?: boolean;
      userHistory?: Record<string, any>;
    }
  ): Promise<ExerciseInstance> {
    const instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      throw new Error(`[ExerciseUnlockService] Instance not found: ${instanceId}`);
    }

    if (instance.status !== 'locked') {
      return instance; // Already unlocked or further in lifecycle
    }

    const definition = await ExerciseRepository.getDefinition(instance.exercise_id);
    const unlockDay = definition?.unlock_rules?.day || 1;

    const isEligible = context.isCompletedCycle || context.currentCycleDay >= unlockDay;

    if (isEligible) {
      return await ExerciseLifecycleService.transitionTo(instanceId, 'available', {
        unlocked_by: 'ExerciseUnlockService',
        unlock_day: unlockDay,
        current_cycle_day: context.currentCycleDay
      });
    }

    return instance;
  }
}
