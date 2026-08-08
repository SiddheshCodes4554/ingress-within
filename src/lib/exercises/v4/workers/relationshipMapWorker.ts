import { supabase } from '../../../../lib/db';
import { ExerciseRepository } from '../repository/exerciseRepository';
import { ExerciseResultService } from '../services/exerciseResultService';
import { RelationshipMapPrompt } from '../ai/relationshipMapPrompt';
import { aiProvider } from '../../../ai/factory';
import { checkAmbivalence, FREQUENCY_CANONICAL_MAP } from '../definitions/relationshipMapCatalog';

export class RelationshipMapWorker {
  public static async processInstance(instanceId: string, payload?: {
    relationship_map?: any[];
    name_mode?: string;
  }): Promise<any> {
    console.log(`[RelationshipMapWorker] Processing instance: ${instanceId}`);

    const instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    let existingResult = await ExerciseResultService.getResult(instanceId);
    const existingAnalysis = existingResult?.analysis || existingResult?.data || {};

    // Parse relationship_map and clean structure
    let relationshipMap: any[] =
      payload?.relationship_map ||
      instance.metadata?.relationship_map ||
      existingAnalysis?.relationship_map ||
      [];

    const nameMode = payload?.name_mode || instance.metadata?.name_mode || existingAnalysis?.name_mode || 'name';

    // Normalize items in relationship_map
    relationshipMap = relationshipMap.map((p: any, idx: number) => ({
      position: idx + 1,
      name: p.name,
      label: p.label,
      feeling: p.feeling || '',
      energy: p.energy || '',
      frequency: FREQUENCY_CANONICAL_MAP[p.frequency] || p.frequency || 'a_little',
      ambivalent: typeof p.ambivalent === 'boolean' ? p.ambivalent : checkAmbivalence(p.feeling || '')
    }));

    // Fetch journal entry count snapshot at time of completion
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

    // CRITICAL REQUIREMENT 19: Immediately persist primary completed result BEFORE AI call
    const initialData = {
      relationship_map: relationshipMap,
      name_mode: nameMode,
      entry_count_at_completion: entryCountAtCompletion,
      highest_drain_person: existingAnalysis?.highest_drain_person || null,
      reflection_text: existingAnalysis?.reflection_text || null
    };

    let storedResult: any = null;
    if (existingResult) {
      const { data: updated } = await supabase
        .from('exercise_results')
        .update({
          summary: existingResult.summary || 'Your relationship map has been recorded below.',
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
        summary: 'Your relationship map has been recorded below.',
        analysis: initialData,
        model: process.env.AI_MODEL || 'claude-sonnet-4-6',
        provider: process.env.AI_PROVIDER || 'groq'
      });
    }

    // Always update instance to completed status immediately
    await supabase
      .from('exercise_instances')
      .update({
        status: 'completed',
        completed_at: instance.completed_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    // If reflection_text already exists and is non-empty, we can return stored result directly
    const currentReflection = storedResult?.analysis?.reflection_text || storedResult?.data?.reflection_text;
    if (currentReflection && storedResult.summary !== 'Your relationship map has been recorded below.') {
      return storedResult;
    }

    // Format roster for AI Prompt
    const rosterFormatted = relationshipMap.map((p: any) => {
      return `${p.position}. ${p.name} (${p.label}) — Feeling: "${p.feeling}" | Energy: ${p.energy} | Frequency: ${p.frequency}${
        p.ambivalent ? ' [ambivalent signal]' : ''
      }`;
    }).join('\n');

    const promptText = RelationshipMapPrompt.buildPrompt(rosterFormatted);

    let summaryText = 'Your relationship map has been recorded below.';
    let reflectionText: string | null = null;
    let highestDrainPerson: string | null = null;

    try {
      const aiPromise = aiProvider.callRaw(promptText);
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Relationship Map AI timeout (8s)')), 8000)
      );

      const rawText = await Promise.race([aiPromise, timeoutPromise]);
      let cleanedText = rawText.trim();

      // Try to parse JSON from AI output
      try {
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.reflection_text) {
            reflectionText = String(parsed.reflection_text).replace(/[*#"`]/g, '').trim();
          }
          if (parsed.highest_drain_person) {
            highestDrainPerson = String(parsed.highest_drain_person).trim();
          }
        }
      } catch (jsonErr) {
        // Fallback: raw text as reflection_text
        reflectionText = cleanedText.replace(/[*#"`]/g, '').trim();
      }

      if (!reflectionText || reflectionText.length < 10) {
        reflectionText = cleanedText.replace(/[*#"`]/g, '').trim();
      }

      // CRITICAL REQUIREMENT 24: Validate highest_drain_person against roster names
      if (highestDrainPerson) {
        const isValidMember = relationshipMap.some(
          p => p.name.toLowerCase() === highestDrainPerson!.toLowerCase()
        );
        if (!isValidMember) {
          console.warn(`[RelationshipMapWorker] Invalid highest_drain_person "${highestDrainPerson}" not in roster. Resetting to null.`);
          highestDrainPerson = null;
        } else {
          // Exact casing from roster
          const matched = relationshipMap.find(p => p.name.toLowerCase() === highestDrainPerson!.toLowerCase());
          if (matched) highestDrainPerson = matched.name;
        }
      }

      if (reflectionText && reflectionText.length > 10) {
        summaryText = reflectionText;
      }
    } catch (err: any) {
      console.warn(`[RelationshipMapWorker] AI call failed or timed out: ${err.message}. Retaining primary fallback.`);
      summaryText = 'Your relationship map has been recorded below.';
      reflectionText = null;
      highestDrainPerson = null;
    }

    // Persist final AI analysis additions into exercise_results
    const finalData = {
      relationship_map: relationshipMap,
      name_mode: nameMode,
      entry_count_at_completion: entryCountAtCompletion,
      highest_drain_person: highestDrainPerson,
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
