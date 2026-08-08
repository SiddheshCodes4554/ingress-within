import { supabase } from '../../../db';
import { aiProvider } from '../../../ai/factory';
import { ExerciseResultService } from '../services/exerciseResultService';
import { ExerciseRepository } from '../repository/exerciseRepository';
import { NarrativeArcPrompt } from '../ai/narrativeArcPrompt';
import { NARRATIVE_ARC_QUESTIONS } from '../definitions/month3Catalog';

export class NarrativeArcWorker {
  public static async processInstance(instanceId: string, payload?: any): Promise<any> {
    console.log(`[NarrativeArcWorker] Processing instance: ${instanceId}`);

    const instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    let existingResult = await ExerciseResultService.getResult(instanceId);
    const existingAnalysis = existingResult?.analysis || existingResult?.data || {};

    const q1 = payload?.q1 !== undefined ? payload.q1 : existingAnalysis?.q1 || '';
    const q2 = payload?.q2 !== undefined ? payload.q2 : existingAnalysis?.q2 || '';
    const q3 = payload?.q3 !== undefined ? payload.q3 : existingAnalysis?.q3 || '';
    const q4 = payload?.q4 !== undefined ? payload.q4 : existingAnalysis?.q4 || '';

    let entryCountAtCompletion = existingAnalysis?.entry_count_at_completion;
    if (entryCountAtCompletion === undefined || entryCountAtCompletion === null) {
      try {
        const { count } = await supabase
          .from('entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', instance.user_id);
        entryCountAtCompletion = count || 0;
      } catch (_) {
        entryCountAtCompletion = 0;
      }
    }

    // Immediate primary persistence BEFORE AI call
    const initialData = {
      q1,
      q2,
      q3,
      q4,
      entry_count_at_completion: entryCountAtCompletion,
      stable_structures: existingAnalysis?.stable_structures || null,
      reflection_text: existingAnalysis?.reflection_text || null
    };

    let storedResult: any = null;
    if (existingResult) {
      const { data: updated } = await supabase
        .from('exercise_results')
        .update({
          summary: existingResult.summary || 'Your responses have been recorded below.',
          analysis: { ...existingAnalysis, ...initialData }
        })
        .eq('id', existingResult.id)
        .select()
        .single();
      storedResult = updated || existingResult;
    } else {
      storedResult = await ExerciseResultService.storeResult({
        instanceId,
        userId: instance.user_id,
        summary: 'Your responses have been recorded below.',
        analysis: initialData,
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

    const currentReflection = storedResult?.analysis?.reflection_text || storedResult?.data?.reflection_text;
    if (currentReflection && storedResult.summary !== 'Your responses have been recorded below.') {
      return storedResult;
    }

    const answersFormatted = `Q1 (${NARRATIVE_ARC_QUESTIONS[0].prompt}): "${q1}"
Q2 (${NARRATIVE_ARC_QUESTIONS[1].prompt}): "${q2}"
Q3 (${NARRATIVE_ARC_QUESTIONS[2].prompt}): "${q3}"
Q4 (${NARRATIVE_ARC_QUESTIONS[3].prompt}): "${q4}"`;

    const promptText = NarrativeArcPrompt.buildPrompt(answersFormatted);

    let summaryText = 'Your responses have been recorded below.';
    let reflectionText: string | null = null;
    let stableStructures: string | null = null;

    try {
      const aiPromise = aiProvider.callRaw(promptText);
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Narrative Arc AI timeout (8s)')), 8000)
      );

      const rawText = await Promise.race([aiPromise, timeoutPromise]);
      const cleanedText = rawText.trim();

      try {
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.reflection_text) reflectionText = String(parsed.reflection_text).trim();
          if (parsed.stable_structures) stableStructures = String(parsed.stable_structures).trim();
        }
      } catch (_) {
        const reflMatch = cleanedText.match(/reflection_text["']?\s*:\s*["']?([\s\S]+?)(?:["']?\s*,\s*["']?stable_structures|["']?\s*\}|$)/i);
        if (reflMatch && reflMatch[1]) {
          reflectionText = reflMatch[1].replace(/^["']|["']$/g, '').trim();
        }
      }

      if (!reflectionText && !cleanedText.includes('{') && !cleanedText.includes('reflection_text')) {
        reflectionText = cleanedText.trim();
      }

      if (reflectionText) {
        reflectionText = reflectionText.replace(/[*#"`]/g, '').trim();
        summaryText = reflectionText;
      }
    } catch (err: any) {
      console.warn(`[NarrativeArcWorker] AI call failed or timed out: ${err.message}. Retaining primary fallback.`);
      summaryText = 'Your responses have been recorded below.';
      reflectionText = null;
      stableStructures = null;
    }

    const finalData = {
      q1,
      q2,
      q3,
      q4,
      entry_count_at_completion: entryCountAtCompletion,
      stable_structures: stableStructures,
      reflection_text: reflectionText
    };

    const { data: finalUpdated } = await supabase
      .from('exercise_results')
      .update({ summary: summaryText, analysis: finalData })
      .eq('id', storedResult.id)
      .select()
      .single();

    return finalUpdated || storedResult;
  }
}
