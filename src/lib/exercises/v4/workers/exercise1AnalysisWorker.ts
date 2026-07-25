import { ExerciseRepository } from '../repository/exerciseRepository';
import { ExerciseLifecycleService } from '../services/exerciseLifecycleService';
import { ExerciseResultService } from '../services/exerciseResultService';
import { Exercise1Prompt } from '../ai/exercise1Prompt';
import { buildSequence, FALLBACK_PERSONALISED, SequenceItem } from '../definitions/exercise1Catalog';
import { aiProvider } from '../../../ai/factory';
import { supabase } from '../../../db';

export class Exercise1AnalysisWorker {
  public static async runCall1(userId: string): Promise<{ words: string[]; sequence: SequenceItem[] }> {
    let entries: string[] = [];
    try {
      const { data } = await supabase
        .from('entries')
        .select('content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(9);
      if (data && data.length > 0) {
        entries = data.map(d => d.content).filter(Boolean);
      }
    } catch (err) {
      console.warn('[Exercise1AnalysisWorker] Error fetching entries for Call 1:', err);
    }

    let words: string[] = FALLBACK_PERSONALISED;
    try {
      const { system, user } = Exercise1Prompt.buildCall1Prompt(entries);
      const call1Promise = aiProvider.callRaw(`${system}\n\n${user}`);
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Call 1 timeout (8s)')), 8000)
      );

      const rawText = await Promise.race([call1Promise, timeoutPromise]);
      const parsed = rawText
        .split(',')
        .map(w => w.trim().toUpperCase())
        .filter(w => w.length > 0)
        .slice(0, 3);
      if (parsed.length >= 2) {
        words = parsed;
      }
    } catch (err: any) {
      console.warn(`[Exercise1AnalysisWorker] Call 1 failed or timed out: ${err.message}. Using fallbacks.`);
    }

    const sequence = buildSequence(words);
    return { words, sequence };
  }

  public static async processInstance(instanceId: string): Promise<any> {
    console.log(`[Exercise1AnalysisWorker] Processing instance: ${instanceId}`);

    // 1. Check existing immutable result
    const existingResult = await ExerciseResultService.getResult(instanceId);
    if (existingResult) {
      console.log(`[Exercise1AnalysisWorker] Stored result exists for ${instanceId}. Returning without regenerating.`);
      return existingResult;
    }

    // 2. Fetch instance details
    const instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    if (instance.status !== 'processing' && instance.status !== 'completed') {
      await ExerciseLifecycleService.transitionTo(instanceId, 'processing');
    }

    // 3. Fetch saved responses
    const responses = await ExerciseRepository.getResponsesForInstance(instanceId);
    const rawResponses = responses.map(r => ({
      position: Number(r.question_id) || 1,
      word: (r as any).prompt || '',
      response: String(r.response)
    }));

    const wordSequence: SequenceItem[] = instance.metadata?.word_sequence || buildSequence(FALLBACK_PERSONALISED);

    // 4. Execute Call 2 Analysis with 10s Timeout
    let cleanText = 'Your responses have been recorded. They will feed into your Day 30 report.';
    let dominantRegister = 'ambivalent';
    let emotionalRegisterGap = 'partial';
    let suppressionFlag = false;
    let revealingPairs: any[] = [];

    try {
      const { system, user } = Exercise1Prompt.buildCall2Prompt(wordSequence, rawResponses);
      const call2Promise = aiProvider.callRaw(`${system}\n\n${user}`);
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Call 2 timeout (10s)')), 10000)
      );

      const rawOutput = await Promise.race([call2Promise, timeoutPromise]);
      const { text, structured } = Exercise1Prompt.parseCall2Output(rawOutput);

      if (text) cleanText = text;

      if (structured) {
        dominantRegister = structured.dominant_register || 'ambivalent';
        emotionalRegisterGap = structured.emotional_register_gap || 'partial';
        suppressionFlag = structured.suppression_flag === true;
        revealingPairs = structured.revealing_pairs || [];
      }
    } catch (err: any) {
      console.warn(`[Exercise1AnalysisWorker] Call 2 failed or timed out: ${err.message}. Applying fallbacks.`);
    }

    const fullAnalysis = {
      summary: cleanText,
      dominant_register: dominantRegister,
      emotional_register_gap: emotionalRegisterGap,
      suppression_flag: suppressionFlag,
      revealing_pairs: revealingPairs,
      raw_responses: rawResponses,
      word_sequence: wordSequence
    };

    // 5. Store Immutable Exercise Result in Database
    const storedResult = await ExerciseResultService.storeResult({
      instanceId,
      userId: instance.user_id,
      summary: cleanText,
      analysis: fullAnalysis,
      model: process.env.AI_MODEL || 'claude-sonnet-4-6',
      provider: process.env.AI_PROVIDER || 'groq'
    });

    // 6. Transition Instance Status to 'completed'
    await ExerciseLifecycleService.transitionTo(instanceId, 'completed');
    console.log(`[Exercise1AnalysisWorker] Successfully completed processing for instance ${instanceId}.`);

    return storedResult;
  }
}
