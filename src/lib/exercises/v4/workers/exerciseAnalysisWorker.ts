import { ExerciseRepository } from '../repository/exerciseRepository';
import { ExerciseLifecycleService } from '../services/exerciseLifecycleService';
import { ExerciseResultService } from '../services/exerciseResultService';
import { Exercise0Prompt } from '../ai/exercise0Prompt';
import { calculateOceanScores } from '../definitions/exercise0Catalog';
import { aiProvider } from '../../../ai/factory';

export class ExerciseAnalysisWorker {
  public static async processInstance(instanceId: string): Promise<any> {
    console.log(`[ExerciseAnalysisWorker] Processing instance: ${instanceId}`);

    // 1. Immutable check: If result already exists, return stored result immediately
    const existingResult = await ExerciseResultService.getResult(instanceId);
    if (existingResult) {
      console.log(`[ExerciseAnalysisWorker] Stored result already exists for ${instanceId}. Returning without AI regeneration.`);
      return existingResult;
    }

    // 2. Fetch instance details
    const instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    // 3. Transition status to 'processing'
    if (instance.status !== 'processing' && instance.status !== 'completed') {
      await ExerciseLifecycleService.transitionTo(instanceId, 'processing');
    }

    // 4. Fetch saved responses
    const responses = await ExerciseRepository.getResponsesForInstance(instanceId);
    const answerMap: Record<string, number> = {};
    responses.forEach(r => {
      answerMap[r.question_id] = Number(r.response);
    });

    const oceanScores = calculateOceanScores(answerMap);

    // 5. Build OCEAN Prompt
    const { system, user } = Exercise0Prompt.buildOceanSummaryPrompt(oceanScores);

    // 6. Execute AI Request with 8s Timeout
    let summaryText = '';
    try {
      const aiPromise = aiProvider.callRaw(`${system}\n\n${user}`);
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timeout (8s)')), 8000)
      );

      const rawText = await Promise.race([aiPromise, timeoutPromise]);
      summaryText = rawText.trim();
    } catch (err: any) {
      console.warn(`[ExerciseAnalysisWorker] AI call failed or timed out: ${err.message}`);
      summaryText = `You tend to process things internally and observe patterns before taking action. That means your reflections often reveal deeper insights over time. This space is designed for exactly that.`;
    }

    const fullAnalysis = {
      summary: summaryText,
      scores: oceanScores,
      answers: answerMap
    };

    // 7. Store Immutable Exercise Result in Database
    const storedResult = await ExerciseResultService.storeResult({
      instanceId,
      userId: instance.user_id,
      summary: summaryText,
      analysis: fullAnalysis,
      model: process.env.AI_MODEL || 'claude-sonnet-4-6',
      provider: process.env.AI_PROVIDER || 'groq'
    });

    // 8. Transition Instance Lifecycle Status to 'completed'
    await ExerciseLifecycleService.transitionTo(instanceId, 'completed');
    console.log(`[ExerciseAnalysisWorker] Successfully completed processing for instance ${instanceId}.`);

    return storedResult;
  }
}
