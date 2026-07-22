import { IntelligenceOrchestrator } from '../orchestrator/intelligenceOrchestrator';

export class ExerciseAnalysisPublisher {
  /**
   * Publishes exercise.analysis.started event.
   */
  public static async publishStarted(userId: string, payload: { instance_id: string; exercise_id: string; cycle_id: string | null }) {
    await IntelligenceOrchestrator.emitEvent(userId, 'exercise.analysis.started', payload);
  }

  /**
   * Publishes exercise.analysis.completed event.
   */
  public static async publishCompleted(userId: string, payload: { instance_id: string; exercise_id: string; cycle_id: string | null }) {
    await IntelligenceOrchestrator.emitEvent(userId, 'exercise.analysis.completed', payload);
  }

  /**
   * Publishes exercise.analysis.failed event.
   */
  public static async publishFailed(userId: string, payload: { instance_id: string; exercise_id: string; cycle_id: string | null; error: string }) {
    await IntelligenceOrchestrator.emitEvent(userId, 'exercise.analysis.failed', payload);
  }

  /**
   * Publishes exercise.analysis.rebuilt event.
   */
  public static async publishRebuilt(userId: string, payload: { instance_id: string; exercise_id: string; cycle_id: string | null }) {
    await IntelligenceOrchestrator.emitEvent(userId, 'exercise.analysis.rebuilt', payload);
  }
}
