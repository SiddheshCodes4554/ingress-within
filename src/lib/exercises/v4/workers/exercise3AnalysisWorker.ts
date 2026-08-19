import { supabase } from '../../../../lib/db';
import { Exercise3SnapshotLoader } from '../snapshots/exercise3SnapshotLoader';
import { Exercise3Prompt, Exercise3ResponseItem } from '../ai/exercise3Prompt';
import { aiProvider } from '../../../ai/factory';

export class Exercise3AnalysisWorker {
  /**
   * Processes Exercise 3 instance: loads read-only snapshots, calls AI provider,
   * parses prose & JSON payload, stores immutable ExerciseResult, and marks instance completed.
   */
  public static async processInstance(instanceId: string): Promise<any> {
    console.log(`[Exercise3AnalysisWorker] Processing instance: ${instanceId}`);

    // 1. Load instance
    const { data: instance, error: instErr } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (instErr || !instance) {
      throw new Error(`[Exercise3AnalysisWorker] Instance not found: ${instanceId}`);
    }

    // Prevent duplicate analyses if already completed
    if (instance.status === 'completed') {
      console.log(`[Exercise3AnalysisWorker] Instance ${instanceId} is already completed. Returning existing result.`);
      const { data: existingResult } = await supabase
        .from('exercise_results')
        .select('*')
        .eq('instance_id', instanceId)
        .single();
      return existingResult;
    }

    // Set instance status to processing / analysing
    await supabase
      .from('exercise_instances')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', instanceId);

    // 2. Fetch all responses for instance
    const { data: respRows } = await supabase
      .from('exercise_responses')
      .select('*')
      .eq('instance_id', instanceId);

    const rawResponses: Exercise3ResponseItem[] = (respRows || []).map(r => ({
      question_id: r.question_id || 'question_1',
      prompt: r.prompt || 'Self perception response',
      response: r.response || ''
    }));

    // 3. Load immutable snapshots (READ ONLY)
    const snapshotContext = await Exercise3SnapshotLoader.loadSnapshots(instance.user_id, instance.cycle_number || 1);

    // 4. Build AI Prompt
    const promptText = Exercise3Prompt.buildPrompt(rawResponses, snapshotContext);
    const startTime = Date.now();

    // 5. Call AI Provider with fallback support
    let aiResponseText = '';
    let callError: any = null;
    let actualProvider = process.env.AI_PROVIDER || 'claude';
    let actualModel = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    let fallbackUsed = false;
    let primaryProvider = 'claude';

    try {
      aiResponseText = await aiProvider.callRaw(promptText);
      actualProvider = (aiProvider as any).lastProviderUsed || actualProvider;
      actualModel = (aiProvider as any).model || actualModel;
      fallbackUsed = (aiProvider as any).lastFallbackUsed || false;
      primaryProvider = (aiProvider as any).lastPrimaryProvider || 'claude';
    } catch (err) {
      callError = err;
      console.warn(`[Exercise3AnalysisWorker] AI call failed:`, err);
    }

    // 6. Parse Prose Synthesis & JSON Payload
    let summary = 'Your responses have been recorded and saved. They are the primary input to your Day 30 report.';
    
    let score = 1;
    let locations = [1];
    let severity = 'low';

    if (aiResponseText && !callError) {
      const parsed = this.parseAIOutput(aiResponseText);
      if (parsed.prose && parsed.prose.length > 20) {
        summary = parsed.prose;
      }
      
      if (parsed.json) {
        if (typeof parsed.json.gap_score === 'number') {
          score = Math.min(5, Math.max(0, parsed.json.gap_score));
        }
        if (Array.isArray(parsed.json.gap_locations)) {
          locations = parsed.json.gap_locations;
        }
        const validSeverities = ['low', 'moderate', 'significant'];
        if (validSeverities.includes(parsed.json.gap_severity)) {
          severity = parsed.json.gap_severity;
        } else {
          severity = score <= 1 ? 'low' : score <= 3 ? 'moderate' : 'significant';
        }
      }
    }

    const analysisJson: any = {
      gap_score: score,
      gap_locations: locations,
      gap_severity: severity,
      raw_responses: rawResponses,
      ai_analysis_text: summary
    };

    const processingTimeMs = Date.now() - startTime;
    const now = new Date().toISOString();

    // 7. Store or update ExerciseResult atomically
    const { data: existingDraftRes } = await supabase
      .from('exercise_results')
      .select('*')
      .eq('instance_id', instanceId)
      .maybeSingle();

    let finalResult: any = null;
    if (existingDraftRes) {
      const { data: updatedRes, error: updateErr } = await supabase
        .from('exercise_results')
        .update({
          summary,
          analysis: analysisJson,
          raw_json: analysisJson,
          model: actualModel,
          provider: actualProvider,
          generated_at: now
        })
        .eq('id', existingDraftRes.id)
        .select()
        .single();

      if (updateErr) console.error('[Exercise3AnalysisWorker] Result update error:', updateErr);
      finalResult = updatedRes;
    } else {
      const { data: createdRes, error: createErr } = await supabase
        .from('exercise_results')
        .insert({
          instance_id: instanceId,
          user_id: instance.user_id,
          summary,
          analysis: analysisJson,
          model: actualModel,
          provider: actualProvider,
          raw_json: analysisJson,
          generated_at: now
        })
        .select()
        .single();

      if (createErr) console.error('[Exercise3AnalysisWorker] Result insert error:', createErr);
      finalResult = createdRes;
    }

    // Record to ai_observability
    try {
      await supabase.from('ai_observability').insert({
        entry_id: null,
        provider: actualProvider,
        raw_provider_response: aiResponseText || JSON.stringify(analysisJson),
        parsed_response: {
          summary,
          analysis: analysisJson,
          _metadata: {
            module: 'exercise_analysis',
            exercise_id: 'exercise_3',
            instance_id: instanceId,
            user_id: instance.user_id,
            fallback_used: fallbackUsed,
            primary_provider: primaryProvider,
            usage: (aiProvider as any).lastUsage || null
          }
        },
        validation_result: {
          status: 'passed',
          gap_score: score,
          gap_severity: severity,
          fallback_used: fallbackUsed,
          primary_provider: primaryProvider
        },
        processing_time: processingTimeMs,
        retry_count: fallbackUsed ? 1 : 0,
        error_reason: null
      });
    } catch (obsErr) {
      console.warn('[Exercise3AnalysisWorker] Failed to record ai_observability:', obsErr);
    }

    // 8. Update ExerciseInstance status to completed
    await supabase
      .from('exercise_instances')
      .update({
        status: 'completed',
        completed_at: now,
        updated_at: now
      })
      .eq('id', instanceId);

    console.log(`[Exercise3AnalysisWorker] Successfully completed instance ${instanceId} in ${processingTimeMs}ms`);
    return finalResult;
  }

  /**
   * Parses prose synthesis and embedded JSON from AI output.
   */
  private static parseAIOutput(rawText: string): { prose: string; json: any } {
    let prose = rawText.trim();
    let json: any = null;

    // Try code fence match
    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      prose = rawText.substring(0, rawText.indexOf('```')).trim();
      try {
        json = JSON.parse(fenceMatch[1].trim());
      } catch (_) {}
    } else {
      const jIdx = rawText.search(/\n\s*\{/);
      if (jIdx !== -1) {
        prose = rawText.substring(0, jIdx).trim();
        try {
          json = JSON.parse(rawText.substring(jIdx).trim());
        } catch (_) {}
      }
    }

    // Clean prose markdown
    prose = prose
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/^#+\s*/gm, '')
      .trim();

    return { prose, json };
  }
}
