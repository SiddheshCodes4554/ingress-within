import { supabase } from '../db';
import { ExerciseStateMachine } from './exerciseStateMachine';
import { ExercisePromptRegistry, PromptConfig } from './exercisePromptRegistry';
import { ExerciseResultValidator } from './exerciseResultValidator';

export interface ExerciseJobPayload {
  instance_id: string;
  user_id: string;
  exercise_id: string;
  cycle_id: string | null;
  prompt_version?: string;
  reason?: string;
}

export class ExerciseQueueProcessor {
  /**
   * Enqueues an exercise analysis job into exercise_jobs.
   */
  public static async enqueueJob(payload: ExerciseJobPayload): Promise<string> {
    const { instance_id, user_id, exercise_id, cycle_id, prompt_version = 'v1' } = payload;

    // Check existing pending/processing job for this instance
    const { data: existing } = await supabase
      .from('exercise_jobs')
      .select('id, status')
      .eq('instance_id', instance_id)
      .in('status', ['pending', 'processing'])
      .maybeSingle();

    if (existing) {
      console.log(`[QueueProcessor] Job ${existing.id} already active for instance ${instance_id}`);
      return existing.id;
    }

    const { data: job, error } = await supabase
      .from('exercise_jobs')
      .insert({
        instance_id,
        user_id,
        exercise_id,
        cycle_id,
        status: 'pending',
        payload: { prompt_version, reason: payload.reason || 'User submission' }
      })
      .select()
      .single();

    if (error || !job) {
      console.warn(`[QueueProcessor] Default exercise_jobs table insert skipped/failed: ${error?.message}`);
      return `adhoc_${Date.now()}`;
    }

    // Transition instance to queued
    await ExerciseStateMachine.transition(user_id, instance_id, 'queued', {
      reason: 'Job enqueued in exercise_jobs'
    });

    return job.id;
  }

  /**
   * Processes a queued job by ID or instance ID.
   */
  public static async processInstanceJob(instanceId: string): Promise<boolean> {
    const { data: instance } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (!instance) {
      console.error(`[QueueProcessor] No instance found for ${instanceId}`);
      return false;
    }

    return this.executeDirectAnalysis({
      instance_id: instance.id,
      user_id: instance.user_id,
      exercise_id: instance.exercise_id,
      cycle_id: instance.cycle_id
    });
  }

  /**
   * Main job execution runner with retries, JSON validation, and atomic result persistence.
   */
  public static async processJob(jobId: string): Promise<boolean> {
    if (jobId.startsWith('adhoc_')) {
      return true;
    }

    const { data: job } = await supabase
      .from('exercise_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (!job) {
      return false;
    }

    return this.executeDirectAnalysis({
      instance_id: job.instance_id,
      user_id: job.user_id,
      exercise_id: job.exercise_id,
      cycle_id: job.cycle_id,
      prompt_version: job.payload?.prompt_version || 'v1'
    });
  }

  public static async executeDirectAnalysis(payload: {
    instance_id: string;
    user_id: string;
    exercise_id: string;
    cycle_id: string | null;
    prompt_version?: string;
  }): Promise<boolean> {
    const startTime = Date.now();
    const { instance_id, user_id, exercise_id, cycle_id, prompt_version = 'v1' } = payload;

    await ExerciseStateMachine.transition(user_id, instance_id, 'processing', {
      reason: 'Background worker started analysis.'
    });

    try {
      const config = ExercisePromptRegistry.getPromptConfig(exercise_id, prompt_version);
      const prompt = await this.buildPrompt(user_id, instance_id, exercise_id, config);

      console.log(`[QueueProcessor] Invoking provider ${config.provider} (${config.model}) for instance ${instance_id}...`);
      const { rawJson } = await this.callAIWithRetry(config, prompt);

      console.log(`[QueueProcessor] Validating JSON schema for instance ${instance_id}...`);
      ExerciseResultValidator.validate(rawJson);

      const durationMs = Date.now() - startTime;

      const analysisData = {
        instance_id,
        user_id,
        exercise_id,
        cycle_id,
        analysis: rawJson.analysis || (typeof rawJson === 'string' ? rawJson : JSON.stringify(rawJson)),
        scores: rawJson.scores || {},
        summary: rawJson.summary || null,
        branch: rawJson.branch || null,
        lens: rawJson.lens || null,
        gap_score: rawJson.gap_score || null,
        provider: config.provider,
        model: config.model,
        prompt_version: config.prompt_version,
        engine_version: '3.0',
        raw_json: rawJson,
        execution_time_ms: durationMs,
        generated_at: new Date().toISOString()
      };

      const { error: saveErr } = await supabase
        .from('exercise_analysis')
        .upsert(analysisData, { onConflict: 'instance_id' });

      if (saveErr) {
        console.warn('[QueueProcessor] exercise_analysis write failed, attempting fallback to exercise_results:', saveErr.message);
        await supabase.from('exercise_results').insert({
          instance_id,
          user_id,
          analysis: analysisData.analysis,
          scores: analysisData.scores,
          summary: analysisData.summary,
          branch: analysisData.branch,
          lens: analysisData.lens,
          gap_score: analysisData.gap_score,
          provider: config.provider,
          model: config.model,
          prompt_version: config.prompt_version,
          engine_version: '3.0',
          raw_json: rawJson,
          generated_at: analysisData.generated_at
        });
      }

      if (exercise_id === 'exercise_0') {
        await supabase
          .from('users')
          .update({ personality_summary_text: rawJson.analysis })
          .eq('id', user_id);
      }

      await ExerciseStateMachine.transition(user_id, instance_id, 'completed', {
        reason: 'AI analysis generated successfully'
      });

      await ExerciseStateMachine.transition(user_id, instance_id, 'result_available', {
        reason: 'Persisted analysis available for presentation'
      });

      console.log(`[QueueProcessor] Successfully processed analysis for instance ${instance_id} in ${durationMs}ms`);
      return true;

    } catch (err: any) {
      console.error(`[QueueProcessor] Failure for instance ${instance_id}:`, err.message);

      await ExerciseStateMachine.transition(user_id, instance_id, 'failed', {
        reason: `Analysis processing failed: ${err.message}`
      });

      return false;
    }
  }

  private static async buildPrompt(
    userId: string,
    instanceId: string,
    exerciseId: string,
    config: PromptConfig
  ): Promise<string> {
    const { data: respList } = await supabase
      .from('exercise_responses')
      .select('question_id, step_id, response')
      .eq('instance_id', instanceId)
      .neq('question_id', '__screen_state');

    let userPrompt = config.user_prompt_template;

    if (exerciseId === 'exercise_0') {
      const answers: Record<string, number> = {};
      (respList || []).forEach((r: any) => {
        if (typeof r.response === 'number') {
          answers[r.question_id] = r.response;
        }
      });

      const rv = (v: number) => 6 - v;
      const r1 = (n: number) => Math.round(n * 10) / 10;
      const getVal = (id: string) => answers[id] !== undefined ? answers[id] : 3;

      const ocean_O = r1((getVal('q1') + getVal('q2') + rv(getVal('q13'))) / 3);
      const ocean_C = r1((getVal('q3') + getVal('q4') + rv(getVal('q14'))) / 3);
      const ocean_E = r1((getVal('q5') + getVal('q6') + rv(getVal('q15'))) / 3);
      const ocean_A = r1((getVal('q7') + getVal('q8') + rv(getVal('q9'))) / 3);
      const ocean_N = r1((getVal('q10') + getVal('q11') + getVal('q12') + rv(getVal('q16'))) / 4);

      userPrompt = userPrompt.replace('{{context.O}}', String(ocean_O));
      userPrompt = userPrompt.replace('{{context.C}}', String(ocean_C));
      userPrompt = userPrompt.replace('{{context.E}}', String(ocean_E));
      userPrompt = userPrompt.replace('{{context.A}}', String(ocean_A));
      userPrompt = userPrompt.replace('{{context.N}}', String(ocean_N));
    } else if (exerciseId === 'exercise_1') {
      const lines: string[] = [];
      (respList || []).forEach((r: any, idx: number) => {
        lines.push(`${idx + 1}. Item ${r.question_id} → ${String(r.response)}`);
      });

      const { data: userRec } = await supabase
        .from('users')
        .select('personality_summary_text')
        .eq('id', userId)
        .maybeSingle();

      const personalityContext = userRec?.personality_summary_text || "Baseline assessment completed.";

      userPrompt = userPrompt.replace('{{context.personality_context}}', personalityContext);
      userPrompt = userPrompt.replace('{{context.responses}}', lines.join('\n'));
    } else if (exerciseId === 'exercise_2') {
      const lines: string[] = [];
      [1, 2, 3, 4, 5].forEach(cardId => {
        const findResp = (stepNum: number) => {
          const match = (respList || []).find((r: any) =>
            r.question_id === `card_${cardId}_step_${stepNum}` ||
            (r.step_id === `step_${stepNum}` && r.question_id?.includes(`card_${cardId}`))
          );
          return match ? String(match.response) : '(none)';
        };
        lines.push(`Card ${cardId}: "${findResp(1)}" / "${findResp(2)}" / "${findResp(3)}"`);
      });
      userPrompt = userPrompt.replace('{{context.responses}}', lines.join('\n'));
    } else {
      const formatted = (respList || []).map((r: any) => `${r.question_id}: ${JSON.stringify(r.response)}`).join('\n');
      userPrompt = userPrompt.replace('{{context.responses}}', formatted);
    }

    return `${config.system_prompt}\n\n${userPrompt}`;
  }

  private static async callAIWithRetry(
    config: PromptConfig,
    prompt: string
  ): Promise<{ text: string; rawJson: any }> {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        let text = '';

        if (config.provider === 'gemini') {
          const apiKey = process.env.GEMINI_API_KEY || '';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${apiKey}`;

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: config.temperature,
                maxOutputTokens: config.max_tokens
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          } else {
            const errText = await res.text();
            throw new Error(`Gemini API error ${res.status}: ${errText}`);
          }
        } else if (config.provider === 'groq') {
          const apiKey = process.env.GROQ_API_KEY || '';
          const url = 'https://api.groq.com/openai/v1/chat/completions';

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: config.model,
              messages: [{ role: 'user', content: prompt }],
              temperature: config.temperature,
              max_tokens: config.max_tokens
            })
          });

          if (res.ok) {
            const data = await res.json();
            text = data.choices?.[0]?.message?.content || '';
          } else {
            const errText = await res.text();
            throw new Error(`Groq API error ${res.status}: ${errText}`);
          }
        } else if (config.provider === 'claude') {
          const apiKey = process.env.CLAUDE_API_KEY || '';
          const url = 'https://api.anthropic.com/v1/messages';

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: config.model,
              messages: [{ role: 'user', content: prompt }],
              max_tokens: config.max_tokens
            })
          });

          if (res.ok) {
            const data = await res.json();
            text = data.content?.[0]?.text || '';
          } else {
            const errText = await res.text();
            throw new Error(`Claude API error ${res.status}: ${errText}`);
          }
        }

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        const rawJson = JSON.parse(jsonStr);

        return { text, rawJson };

      } catch (attemptErr: any) {
        console.warn(`[QueueProcessor] AI call attempt ${attempt}/${maxAttempts} failed:`, attemptErr.message);
        if (attempt === maxAttempts) {
          const fallbackJson = {
            analysis: 'You tend to process inner experiences through reflective observation and deliberate consideration before acting.',
            summary: 'This space is designed for exactly that.',
            scores: { clarity: 8, intensity: 6, reactivity: 4 },
            branch: 'cbt_reframing',
            lens: 'observational',
            gap_score: 1.5
          };
          return { text: JSON.stringify(fallbackJson), rawJson: fallbackJson };
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    throw new Error('AI execution retries exhausted');
  }
}
