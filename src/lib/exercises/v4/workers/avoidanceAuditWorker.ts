import { supabase } from '../../../../lib/db';
import { ExerciseRepository } from '../repository/exerciseRepository';
import { ExerciseResultService } from '../services/exerciseResultService';
import { AvoidanceAuditPrompt } from '../ai/avoidanceAuditPrompt';
import { aiProvider } from '../../../ai/factory';

export class AvoidanceAuditWorker {
  public static async processInstance(instanceId: string, payload?: {
    completions?: Record<number, string>;
  }): Promise<any> {
    console.log(`[AvoidanceAuditWorker] Processing instance: ${instanceId}`);

    const instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    let existingResult = await ExerciseResultService.getResult(instanceId);

    const completions =
      payload?.completions ||
      instance.metadata?.completions ||
      existingResult?.data?.completions ||
      {};

    if (existingResult && existingResult.summary && existingResult.summary !== 'Your avoidance audit responses have been recorded below.') {
      return existingResult;
    }

    const completionsFormatted = Object.entries(completions)
      .map(([promptNum, text]) => `${promptNum}. ${text}`)
      .join('\n');

    const promptText = AvoidanceAuditPrompt.buildPrompt(completionsFormatted);

    let summaryText = 'Your avoidance audit responses have been recorded below.';
    try {
      const aiPromise = aiProvider.callRaw(promptText);
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Avoidance Audit AI timeout (8s)')), 8000)
      );

      const rawText = await Promise.race([aiPromise, timeoutPromise]);
      let cleanedText = rawText.trim().replace(/[*#"`]/g, '').trim();

      if (cleanedText && cleanedText.length > 10) {
        summaryText = cleanedText;
      }
    } catch (err: any) {
      console.warn(`[AvoidanceAuditWorker] AI call failed or timed out: ${err.message}. Using fallback.`);
      summaryText = 'Your avoidance audit responses have been recorded below.';
    }

    const fullData = {
      completions: completions,
      reflection_text: summaryText
    };

    let storedResult: any = null;
    if (existingResult) {
      const { data: updated } = await supabase
        .from('exercise_results')
        .update({ summary: summaryText, data: fullData })
        .eq('id', existingResult.id)
        .select()
        .single();
      storedResult = updated || existingResult;
    } else {
      storedResult = await ExerciseResultService.storeResult({
        instanceId,
        userId: instance.user_id,
        summary: summaryText,
        analysis: fullData,
        model: process.env.AI_MODEL || 'claude-sonnet-4-6',
        provider: process.env.AI_PROVIDER || 'groq'
      });
    }

    await supabase
      .from('exercise_instances')
      .update({
        status: 'completed',
        completed_at: instance.completed_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    return storedResult;
  }
}
