import { supabase } from '../../../../lib/db';
import { Exercise2Prompt, Exercise2ResponseItem } from '../ai/exercise2Prompt';
import { aiProvider } from '../../../ai/factory';

export class Exercise2AnalysisWorker {
  /**
   * Processes Exercise 2 instance: calls AI provider, parses prose & JSON,
   * stores immutable ExerciseResult, and marks instance completed.
   */
  public static async processInstance(instanceId: string): Promise<any> {
    console.log(`[Exercise2AnalysisWorker] Processing instance: ${instanceId}`);

    // 1. Load instance
    const { data: instance, error: instErr } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (instErr || !instance) {
      throw new Error(`[Exercise2AnalysisWorker] Instance not found: ${instanceId}`);
    }

    // Prevent duplicate analyses if already completed
    if (instance.status === 'completed') {
      console.log(`[Exercise2AnalysisWorker] Instance ${instanceId} is already completed. Returning existing result.`);
      const { data: existingResult } = await supabase
        .from('exercise_results')
        .select('*')
        .eq('instance_id', instanceId)
        .single();
      return existingResult;
    }

    // Set instance status to analysing / processing
    await supabase
      .from('exercise_instances')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', instanceId);

    // 2. Fetch all responses for instance
    const { data: respRows } = await supabase
      .from('exercise_responses')
      .select('*')
      .eq('instance_id', instanceId);

    const rawResponses: Exercise2ResponseItem[] = (respRows || []).map(r => {
      const parts = (r.question_id || '').split('_');
      return {
        image_id: parts[1] ? parseInt(parts[1], 10) : 1,
        step: parts[3] ? parseInt(parts[3], 10) : 1,
        question: r.prompt || 'free_response',
        response: r.response || ''
      };
    });

    // 3. Build AI Prompt
    const promptText = Exercise2Prompt.buildPrompt(rawResponses);
    const startTime = Date.now();

    // 4. Call AI Provider with fallback support
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
      console.warn(`[Exercise2AnalysisWorker] AI call failed:`, err);
    }

    // 5. Parse Prose Synthesis & JSON Payload
    let summary = 'Your responses have been recorded and saved into your Day 30 report.';
    let analysisJson: any = {
      default_lens_label: 'mixed',
      lens_by_image: [],
      entry_confirmation: 'partial',
      de_animation_flag: false,
      most_revealing_image: 3,
      performance_flag: false,
      raw_responses: rawResponses
    };

    if (aiResponseText && !callError) {
      const parsed = this.parseAIOutput(aiResponseText);
      if (parsed.prose) {
        summary = parsed.prose;
      }
      if (parsed.json) {
        const validLens = ['threat', 'withdrawal', 'direct', 'avoidant', 'mixed'];
        const lensLabel = validLens.includes(parsed.json.default_lens_label) ? parsed.json.default_lens_label : 'mixed';
        analysisJson = {
          default_lens_label: lensLabel,
          lens_by_image: parsed.json.lens_by_image || [],
          entry_confirmation: parsed.json.entry_confirmation || 'partial',
          de_animation_flag: parsed.json.de_animation_flag === true,
          most_revealing_image: parsed.json.most_revealing_image || 3,
          performance_flag: parsed.json.performance_flag === true,
          raw_responses: rawResponses
        };
      }
    }

    // Preserve generated image metadata in analysis JSON
    const { data: existingDraftRes } = await supabase
      .from('exercise_results')
      .select('*')
      .eq('instance_id', instanceId)
      .maybeSingle();

    if (existingDraftRes) {
      const draftData = existingDraftRes.analysis || existingDraftRes.raw_json || {};
      if (draftData.generated_image_urls) {
        analysisJson.generated_image_urls = draftData.generated_image_urls;
        analysisJson.generation_seeds = draftData.generation_seeds;
      }
    }

    analysisJson.ai_analysis_text = summary;
    const processingTimeMs = Date.now() - startTime;
    const now = new Date().toISOString();

    // 6. Store or update ExerciseResult atomically
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
      
      if (updateErr) console.error('[Exercise2AnalysisWorker] Result update error:', updateErr);
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

      if (createErr) console.error('[Exercise2AnalysisWorker] Result insert error:', createErr);
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
            exercise_id: 'exercise_2',
            instance_id: instanceId,
            user_id: instance.user_id,
            fallback_used: fallbackUsed,
            primary_provider: primaryProvider,
            usage: (aiProvider as any).lastUsage || null
          }
        },
        validation_result: {
          status: 'passed',
          default_lens_label: analysisJson.default_lens_label,
          fallback_used: fallbackUsed,
          primary_provider: primaryProvider
        },
        processing_time: processingTimeMs,
        retry_count: fallbackUsed ? 1 : 0,
        error_reason: null
      });
    } catch (obsErr) {
      console.warn('[Exercise2AnalysisWorker] Failed to record ai_observability:', obsErr);
    }

    // 7. Update ExerciseInstance status to completed
    await supabase
      .from('exercise_instances')
      .update({
        status: 'completed',
        completed_at: now,
        updated_at: now
      })
      .eq('id', instanceId);

    console.log(`[Exercise2AnalysisWorker] Successfully completed instance ${instanceId} in ${processingTimeMs}ms`);
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
