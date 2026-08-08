import { supabase } from '../../../db';
import { aiProvider } from '../../../ai/factory';
import { ExerciseResultService } from '../services/exerciseResultService';
import { ExerciseRepository } from '../repository/exerciseRepository';
import { TriggerMappingPrompt } from '../ai/triggerMappingPrompt';
import { decrypt } from '../../../encryption';

export class TriggerMappingWorker {
  public static async processInstance(instanceId: string, payload?: any): Promise<any> {
    console.log(`[TriggerMappingWorker] Processing instance: ${instanceId}`);

    const instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    let existingResult = await ExerciseResultService.getResult(instanceId);
    const existingAnalysis = existingResult?.analysis || existingResult?.data || {};

    const entryAnswers = payload?.entry_answers || payload?.answers || existingAnalysis?.entry_answers || [];
    const synthesisAnswer = payload?.synthesis_answer || payload?.synthesis || existingAnalysis?.synthesis_answer || '';

    // Fetch user's top 5 high-intensity journal entries server-side
    let selectedEntries = existingAnalysis?.selected_entries || [];
    if (!Array.isArray(selectedEntries) || selectedEntries.length === 0) {
      try {
        const { data: entries } = await supabase
          .from('entries')
          .select('id, created_at, written_at, day_ei, content, new_entry_text_encrypted, new_entry_text_iv')
          .eq('user_id', instance.user_id)
          .order('day_ei', { ascending: false })
          .limit(5);

        if (entries && entries.length > 0) {
          selectedEntries = entries.map(e => {
            const rawText = decrypt(e.new_entry_text_encrypted, e.new_entry_text_iv) || e.content || '';
            const excerpt = rawText.length > 200 ? rawText.slice(0, 200) + '...' : rawText;
            return {
              id: e.id,
              date: e.written_at || e.created_at,
              excerpt
            };
          });
        }
      } catch (err) {
        console.warn('[TriggerMappingWorker] Error fetching top entries:', err);
      }
    }

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
      selected_entries: selectedEntries,
      entry_answers: entryAnswers,
      synthesis_answer: synthesisAnswer,
      entry_count_at_completion: entryCountAtCompletion,
      trigger_architecture: existingAnalysis?.trigger_architecture || null,
      decision_points: existingAnalysis?.decision_points || [],
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

    // Format entries and answers for AI call
    const entriesFormatted = selectedEntries.map((e: any, idx: number) => {
      return `Moment ${idx + 1} (${e.date || 'Entry'}): "${e.excerpt}"`;
    }).join('\n\n');

    const userAnswersFormatted = entryAnswers.map((a: any, idx: number) => {
      return `Moment ${idx + 1}:
- Q1 (What was actually happening): ${a.q1 || 'N/A'}
- Q2 (What were you most afraid of): ${a.q2 || 'N/A'}
- Q3 (How did it resolve): ${a.q3 || 'N/A'}`;
    }).join('\n\n') + `\n\nSynthesis (Pattern across situations): ${synthesisAnswer}`;

    const promptText = TriggerMappingPrompt.buildPrompt(entriesFormatted, userAnswersFormatted);

    let summaryText = 'Your responses have been recorded below.';
    let reflectionText: string | null = null;
    let triggerArchitecture: string | null = null;
    let decisionPoints: string[] = [];

    try {
      const aiPromise = aiProvider.callRaw(promptText);
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Trigger Mapping AI timeout (8s)')), 8000)
      );

      const rawText = await Promise.race([aiPromise, timeoutPromise]);
      const cleanedText = rawText.trim();

      try {
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.reflection_text) reflectionText = String(parsed.reflection_text).trim();
          if (parsed.trigger_architecture) triggerArchitecture = String(parsed.trigger_architecture).trim();
          if (Array.isArray(parsed.decision_points)) decisionPoints = parsed.decision_points;
        }
      } catch (_) {
        // Regex fallback
        const reflMatch = cleanedText.match(/reflection_text["']?\s*:\s*["']?([\s\S]+?)(?:["']?\s*,\s*["']?trigger_architecture|["']?\s*\}|$)/i);
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
      console.warn(`[TriggerMappingWorker] AI call failed or timed out: ${err.message}. Retaining primary fallback.`);
      summaryText = 'Your responses have been recorded below.';
      reflectionText = null;
      triggerArchitecture = null;
      decisionPoints = [];
    }

    const finalData = {
      selected_entries: selectedEntries,
      entry_answers: entryAnswers,
      synthesis_answer: synthesisAnswer,
      entry_count_at_completion: entryCountAtCompletion,
      trigger_architecture: triggerArchitecture,
      decision_points: decisionPoints,
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
