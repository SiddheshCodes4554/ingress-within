import { ExerciseRepository } from '../repository/exerciseRepository';
import { ExerciseResult } from '../types/exercise.types';

export class ExerciseResultService {
  /**
   * Generates or retrieves an ExerciseResult.
   * Enforces immutability: if a result already exists for the instance, it returns the existing result
   * and NEVER re-invokes AI generation.
   */
  public static async storeResult(params: {
    instanceId: string;
    userId: string;
    summary: string;
    analysis: any;
    score?: number;
    model?: string;
    provider?: string;
  }): Promise<ExerciseResult> {
    // 1. Check if immutable result already exists
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
      score: params.score !== undefined ? params.score : undefined,
      model: params.model || 'v4-ai-engine',
      provider: params.provider || 'groq'
    } as any);
  }

  public static async getResult(instanceId: string): Promise<ExerciseResult | null> {
    return await ExerciseRepository.getResultForInstance(instanceId);
  }
}
