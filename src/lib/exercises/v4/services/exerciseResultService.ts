import { ExerciseRepository } from '../repository/exerciseRepository';
import { ExerciseResult } from '../types/exercise.types';

export class ExerciseResultService {
  /**
   * Fetches an existing immutable exercise result. Returns null if not generated yet.
   */
  public static async getResult(instanceId: string): Promise<ExerciseResult | null> {
    return await ExerciseRepository.getResultForInstance(instanceId);
  }

  /**
   * Stores an immutable exercise result in the database.
   */
  public static async storeResult(params: {
    instanceId: string;
    userId: string;
    analysis: any;
    summary: string;
    score?: number;
    model?: string;
    provider?: string;
  }): Promise<ExerciseResult> {
    // 1. Check if result already exists for this instance (IMMUTABLE GUARD)
    const existing = await ExerciseRepository.getResultForInstance(params.instanceId);
    if (existing) {
      console.log(`[ExerciseResultService] Result already exists for instance ${params.instanceId}. Returning immutable stored result.`);
      return existing;
    }

    // 2. Insert new result record
    return await ExerciseRepository.saveResult({
      instance_id: params.instanceId,
      user_id: params.userId,
      summary: params.summary,
      analysis: params.analysis,
      score: params.score ?? null,
      model: params.model || 'v4-ai-engine',
      provider: params.provider || 'groq'
    });
  }
}
