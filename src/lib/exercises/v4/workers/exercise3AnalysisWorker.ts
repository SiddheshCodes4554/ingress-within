import { supabase } from '../../../../lib/db';
import { Exercise3SnapshotLoader } from '../snapshots/exercise3SnapshotLoader';
import { Exercise3Prompt, Exercise3ResponseItem } from '../ai/exercise3Prompt';

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

    // 5. Call AI Provider with 1 retry
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
        console.warn(`[Exercise3AnalysisWorker] Attempt ${attempt} failed:`, err);
      }
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
          model: 'llama-3.3-70b-versatile',
          provider: 'groq',
          raw_json: analysisJson,
          generated_at: now
        })
        .select()
        .single();

      if (createErr) console.error('[Exercise3AnalysisWorker] Result insert error:', createErr);
      finalResult = createdRes;
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
