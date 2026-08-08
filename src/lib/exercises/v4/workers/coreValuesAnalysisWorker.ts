import { supabase } from '../../../../lib/db';
import { ExerciseRepository } from '../repository/exerciseRepository';
import { ExerciseResultService } from '../services/exerciseResultService';
import { CoreValuesPrompt } from '../ai/coreValuesPrompt';
import { aiProvider } from '../../../ai/factory';

export class CoreValuesAnalysisWorker {
  public static async processInstance(instanceId: string, payload?: {
    selected_values?: string[];
    selection_order?: string[];
    reorder_delta?: number;
  }): Promise<any> {
    console.log(`[CoreValuesAnalysisWorker] Processing instance: ${instanceId}`);

    const instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    // 1. Fetch existing result if already created
    let existingResult = await ExerciseResultService.getResult(instanceId);

    // Extract values from payload or instance metadata or existing result data
    const selectedValues: string[] =
      payload?.selected_values ||
      instance.metadata?.selected_values ||
      existingResult?.data?.selected_values ||
      [];

    const selectionOrder: string[] =
      payload?.selection_order ||
      instance.metadata?.selection_order ||
      existingResult?.data?.selection_order ||
      selectedValues;

    const reorderDelta: number =
      payload?.reorder_delta !== undefined
        ? payload.reorder_delta
        : instance.metadata?.reorder_delta !== undefined
        ? instance.metadata.reorder_delta
        : existingResult?.data?.reorder_delta || 0;

    // Check if valid reflection_text is already stored
    if (existingResult && existingResult.summary && existingResult.summary !== 'Your values have been recorded below.') {
      console.log(`[CoreValuesAnalysisWorker] Valid stored reflection already exists for instance ${instanceId}. Returning.`);
      return existingResult;
    }

    // 2. Build AI Prompt
    const promptText = CoreValuesPrompt.buildPrompt({
      selectedValues,
      selectionOrder,
      reorderDelta
    });

    let summaryText = 'Your values have been recorded below.';
    try {
      const aiPromise = aiProvider.callRaw(promptText);
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Core Values AI timeout (8s)')), 8000)
      );

      const rawText = await Promise.race([aiPromise, timeoutPromise]);
      let cleanedText = rawText.trim();
      // Remove any unwanted markdown asterisks, hash tags, or quotes per prompt guidelines
      cleanedText = cleanedText.replace(/[*#"`]/g, '').trim();

      if (cleanedText && cleanedText.length > 10) {
        summaryText = cleanedText;
      }
    } catch (err: any) {
      console.warn(`[CoreValuesAnalysisWorker] AI call failed or timed out: ${err.message}. Using fallback reflection.`);
      summaryText = 'Your values have been recorded below.';
    }

    const fullData = {
      selected_values: selectedValues,
      selection_order: selectionOrder,
      reorder_delta: reorderDelta,
      reflection_text: summaryText
    };

    // 3. Save or update immutable result
    let storedResult: any = null;
    if (existingResult) {
      const { data: updated, error } = await supabase
        .from('exercise_results')
        .update({
          summary: summaryText,
          data: fullData
        })
        .eq('id', existingResult.id)
        .select()
        .single();

      if (!error && updated) {
        storedResult = updated;
      } else {
        storedResult = existingResult;
      }
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

    // Ensure instance is completed
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
