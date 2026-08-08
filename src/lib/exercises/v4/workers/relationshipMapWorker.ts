import { supabase } from '../../../../lib/db';
import { ExerciseRepository } from '../repository/exerciseRepository';
import { ExerciseResultService } from '../services/exerciseResultService';
import { RelationshipMapPrompt } from '../ai/relationshipMapPrompt';
import { aiProvider } from '../../../ai/factory';

export class RelationshipMapWorker {
  public static async processInstance(instanceId: string, payload?: {
    relationship_map?: any[];
  }): Promise<any> {
    console.log(`[RelationshipMapWorker] Processing instance: ${instanceId}`);

    const instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    let existingResult = await ExerciseResultService.getResult(instanceId);

    const relationshipMap =
      payload?.relationship_map ||
      instance.metadata?.relationship_map ||
      existingResult?.data?.relationship_map ||
      [];

    if (existingResult && existingResult.summary && existingResult.summary !== 'Your relationship map has been recorded below.') {
      return existingResult;
    }

    const rosterFormatted = (relationshipMap || []).map((p: any, idx: number) => {
      return `${idx + 1}. ${p.name} (${p.label}) — Feeling: "${p.feeling}" | Energy: ${p.energy} | Frequency: ${p.frequency}${
        p.ambivalent ? ' [ambivalent signal]' : ''
      }`;
    }).join('\n');

    const promptText = RelationshipMapPrompt.buildPrompt(rosterFormatted);

    let summaryText = 'Your relationship map has been recorded below.';
    try {
      const aiPromise = aiProvider.callRaw(promptText);
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Relationship Map AI timeout (8s)')), 8000)
      );

      const rawText = await Promise.race([aiPromise, timeoutPromise]);
      let cleanedText = rawText.trim().replace(/[*#"`]/g, '').trim();

      if (cleanedText && cleanedText.length > 10) {
        summaryText = cleanedText;
      }
    } catch (err: any) {
      console.warn(`[RelationshipMapWorker] AI call failed or timed out: ${err.message}. Using fallback.`);
      summaryText = 'Your relationship map has been recorded below.';
    }

    const fullData = {
      relationship_map: relationshipMap,
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
