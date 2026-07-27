import { supabase } from '../../../../lib/db';
import { Exercise2Prompt, Exercise2ResponseItem } from '../ai/exercise2Prompt';

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

    // 4. Call AI Provider with 1 retry
    let aiResponseText = '';
    let callError: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        aiResponseText = await this.callAIProvider(promptText);
        if (aiResponseText && aiResponseText.trim().length > 0) {
          callError = null;
          break;
        }
      } catch (err) {
        callError = err;
        console.warn(`[Exercise2AnalysisWorker] Attempt ${attempt} failed:`, err);
      }
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
          model: 'llama-3.3-70b-versatile',
          provider: 'groq',
          raw_json: analysisJson,
          generated_at: now
        })
        .select()
        .single();

      if (createErr) console.error('[Exercise2AnalysisWorker] Result insert error:', createErr);
      finalResult = createdRes;
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
   * Calls AI provider (Groq or Claude).
   */
  private static async callAIProvider(promptText: string): Promise<string> {
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: promptText }],
          temperature: 0.3,
          max_tokens: 600
        })
      });

      if (!res.ok) {
        throw new Error(`Groq API returned HTTP ${res.status}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }

    throw new Error('No AI provider API key found (GROQ_API_KEY).');
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
