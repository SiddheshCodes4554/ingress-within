import { IntelligenceOrchestrator } from '../orchestrator/intelligenceOrchestrator';

export class ExerciseEventPublisher {
  /**
   * Publishes exercise.unlocked event.
   */
  public static async publishUnlocked(userId: string, payload: { instance_id: string; exercise_id: string; cycle_id: string | null }) {
    await IntelligenceOrchestrator.emitEvent(userId, 'exercise.unlocked', payload);
  }

  /**
   * Publishes exercise.started event.
   */
  public static async publishStarted(userId: string, payload: { instance_id: string; exercise_id: string; cycle_id: string | null }) {
    await IntelligenceOrchestrator.emitEvent(userId, 'exercise.started', payload);
  }

  /**
   * Publishes exercise.progress event.
   */
  public static async publishProgress(userId: string, payload: { instance_id: string; exercise_id: string; cycle_id: string | null; question_id: string; step_id: string }) {
    await IntelligenceOrchestrator.emitEvent(userId, 'exercise.progress', payload);
  }

  /**
   * Publishes exercise.completed event.
   */
  public static async publishCompleted(userId: string, payload: { instance_id: string; exercise_id: string; cycle_id: string | null }) {
    await IntelligenceOrchestrator.emitEvent(userId, 'exercise.completed', payload);
  }

  /**
   * Publishes exercise.analysis.started event.
   */
  public static async publishAnalysisStarted(userId: string, payload: { instance_id: string; exercise_id: string; cycle_id: string | null }) {
    await IntelligenceOrchestrator.emitEvent(userId, 'exercise.analysis.started', payload);
  }

  /**
   * Publishes exercise.analysis.completed event.
   */
  public static async publishAnalysisCompleted(userId: string, payload: { instance_id: string; exercise_id: string; cycle_id: string | null }) {
    await IntelligenceOrchestrator.emitEvent(userId, 'exercise.analysis.completed', payload);
  }

  /**
   * Publishes exercise.failed event.
   */
  public static async publishFailed(userId: string, payload: { instance_id: string; exercise_id: string; cycle_id: string | null; error: string }) {
    await IntelligenceOrchestrator.emitEvent(userId, 'exercise.failed', payload);
  }

  /**
   * Publishes exercise.rebuilt event.
   */
  public static async publishRebuilt(userId: string, payload: { instance_id: string; exercise_id: string; cycle_id: string | null }) {
    await IntelligenceOrchestrator.emitEvent(userId, 'exercise.rebuilt', payload);
  }
}
