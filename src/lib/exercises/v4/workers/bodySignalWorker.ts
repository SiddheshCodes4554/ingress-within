import { supabase } from '../../../../lib/db';
import { ExerciseRepository } from '../repository/exerciseRepository';
import { ExerciseResultService } from '../services/exerciseResultService';
import { BodySignalPrompt } from '../ai/bodySignalPrompt';
import { aiProvider } from '../../../ai/factory';

export class BodySignalWorker {
  public static async processInstance(instanceId: string, payload?: {
    system_signals?: Record<string, any>;
  }): Promise<any> {
    console.log(`[BodySignalWorker] Processing instance: ${instanceId}`);

    const instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    let existingResult = await ExerciseResultService.getResult(instanceId);

    const systemSignals =
      payload?.system_signals ||
      instance.metadata?.system_signals ||
      existingResult?.data?.system_signals ||
      {};

    if (existingResult && existingResult.summary && existingResult.summary !== 'Your body signal inventory has been recorded below.') {
      return existingResult;
    }

    const signalsFormatted = Object.entries(systemSignals)
      .map(([sysKey, data]: [string, any]) => {
        return `- ${sysKey}: ${data.signal || 'None'} ${data.detail ? `(${data.detail})` : ''}`;
      })
      .join('\n');

    const promptText = BodySignalPrompt.buildPrompt(signalsFormatted);

    let summaryText = 'Your body signal inventory has been recorded below.';
    try {
      const aiPromise = aiProvider.callRaw(promptText);
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Body Signal AI timeout (8s)')), 8000)
      );

      const rawText = await Promise.race([aiPromise, timeoutPromise]);
      let cleanedText = rawText.trim().replace(/[*#"`]/g, '').trim();

      if (cleanedText && cleanedText.length > 10) {
        summaryText = cleanedText;
      }
    } catch (err: any) {
      console.warn(`[BodySignalWorker] AI call failed or timed out: ${err.message}. Using fallback.`);
      summaryText = 'Your body signal inventory has been recorded below.';
    }

    const fullData = {
      system_signals: systemSignals,
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
