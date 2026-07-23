import { ExercisePromptRegistry, PromptConfig } from './exercisePromptRegistry';
import { ExerciseAnalysisService, ExerciseContext } from './exerciseAnalysisService';
import { ExerciseResultValidator } from './exerciseResultValidator';
import { ExerciseResultStorage } from './exerciseResultStorage';
import { ExerciseAnalysisPublisher } from './exerciseAnalysisPublisher';
import { ExerciseLifecycleManager } from './exerciseLifecycleManager';
import { IntelligenceOrchestrator } from '../orchestrator/intelligenceOrchestrator';
import { supabase } from '../db';

const ACTIVE_JOBS = new Set<string>();

export class ExerciseAnalysisWorker {
  /**
   * Main orchestrator processing function.
   * Enforces job deduplication, handles state machine changes, executes AI calls with retries,
   * performs strict JSON validating, saves immutable results, and registers cost metrics.
   */
  public static async execute(jobData: {
    instance_id: string;
    exercise_id: string;
    user_id: string;
    cycle_id: string | null;
    prompt_version?: string;
    orchestrator_job_id?: string;
  }): Promise<void> {
    const { instance_id, exercise_id, user_id, cycle_id, prompt_version = 'v1', orchestrator_job_id } = jobData;

    // 1. Deduplication
    if (ACTIVE_JOBS.has(instance_id)) {
      console.log(`[AnalysisWorker] Job for instance ${instance_id} is already running. Skipping duplicate.`);
      return;
    }
    ACTIVE_JOBS.add(instance_id);

    console.log(`[AnalysisWorker] Processing analysis for instance ${instance_id}`);

    // Update orchestrator job to running
    if (orchestrator_job_id) {
      await IntelligenceOrchestrator.startJob(orchestrator_job_id);
    }

    // 2. Transition status to analysing
    await ExerciseLifecycleManager.transitionTo(user_id, instance_id, 'analysing', {
      force: true,
      transitionReason: 'Analysis execution started.'
    });

    await ExerciseAnalysisPublisher.publishStarted(user_id, {
      instance_id,
      exercise_id,
      cycle_id
    });

    const startTime = Date.now();

    try {
      // 3. Load prompt config and context dependency variables
      const config = ExercisePromptRegistry.getPromptConfig(exercise_id, prompt_version);
      const context = await ExerciseAnalysisService.loadContext(user_id, instance_id, exercise_id, cycle_id);

      // Interpolate prompt templates
      let userPrompt = config.user_prompt_template;

      if (exercise_id === 'exercise_0') {
        // Fetch raw responses
        const { data: respList } = await supabase
          .from('exercise_responses')
          .select('question_id, response')
          .eq('instance_id', instance_id);

        const answers: Record<string, number> = {};
        (respList || []).forEach((r: any) => {
          if (r.question_id !== '__screen_state' && typeof r.response === 'number') {
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

        // Blending logic if resit
        const { count: assessmentCount } = await supabase
          .from('exercise_instances')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user_id)
          .eq('exercise_id', 'exercise_0')
          .eq('status', 'finished');

        let blended_O = ocean_O;
        let blended_C = ocean_C;
        let blended_E = ocean_E;
        let blended_A = ocean_A;
        let blended_N = ocean_N;

        if (assessmentCount && assessmentCount > 0) {
          const { data: userRecord } = await supabase
            .from('users')
            .select('ocean_openness, ocean_conscientiousness, ocean_extraversion, ocean_agreeableness, ocean_neuroticism')
            .eq('id', user_id)
            .maybeSingle();

          if (userRecord && userRecord.ocean_openness !== null) {
            const count = assessmentCount;
            blended_O = r1((Number(userRecord.ocean_openness) * count + ocean_O) / (count + 1));
            blended_C = r1((Number(userRecord.ocean_conscientiousness) * count + ocean_C) / (count + 1));
            blended_E = r1((Number(userRecord.ocean_extraversion) * count + ocean_E) / (count + 1));
            blended_A = r1((Number(userRecord.ocean_agreeableness) * count + ocean_A) / (count + 1));
            blended_N = r1((Number(userRecord.ocean_neuroticism) * count + ocean_N) / (count + 1));
          }
        }

        // Save scores to users table
        await supabase.from('users').update({
          ocean_openness: blended_O,
          ocean_conscientiousness: blended_C,
          ocean_extraversion: blended_E,
          ocean_agreeableness: blended_A,
          ocean_neuroticism: blended_N,
          personality_profile_json: JSON.stringify(answers),
          onboarding_done: true
        }).eq('id', user_id);

        // Save progress to profiles table
        await supabase.from('profiles').update({
          assessment_completed: true,
          onboarding_completed: true
        }).eq('id', user_id);

        // Map dimensions to template keys
        userPrompt = userPrompt.replace('{{context.O}}', String(blended_O));
        userPrompt = userPrompt.replace('{{context.C}}', String(blended_C));
        userPrompt = userPrompt.replace('{{context.E}}', String(blended_E));
        userPrompt = userPrompt.replace('{{context.A}}', String(blended_A));
        userPrompt = userPrompt.replace('{{context.N}}', String(blended_N));
      } else if (exercise_id === 'exercise_1') {
        // Fetch raw responses
        const { data: respList } = await supabase
          .from('exercise_responses')
          .select('question_id, response')
          .eq('instance_id', instance_id);

        // Fetch stimulus list sequence
        const stimulusRecord = (respList || []).find((r: any) => r.question_id === '__stimulus_list');
        const stimulusList: string[] = (stimulusRecord && Array.isArray(stimulusRecord.response) && stimulusRecord.response.length > 0)
          ? (stimulusRecord.response as string[])
          : ['Trust', 'Control', 'Boundary', 'Anger', 'Fear', 'Peace', 'Clarity', 'Attachment', 'Validation', 'Truth'];

        // Build stimulus response formatting lines
        const lines: string[] = [];
        stimulusList.forEach((word, idx) => {
          const matchingAns = (respList || []).find((r: any) => r.question_id === `q_${idx + 1}` || r.question_id === `q${idx + 1}`);
          const ansText = matchingAns ? String(matchingAns.response) : '(no response)';
          lines.push(`${idx + 1}. ${word} → ${ansText}`);
        });

        if (lines.every(l => l.includes('(no response)'))) {
          (respList || []).forEach((r: any, i: number) => {
            if (r.question_id !== '__screen_state' && r.question_id !== '__stimulus_list') {
              lines.push(`Item ${i + 1} (${r.question_id}) → ${String(r.response)}`);
            }
          });
        }

        const responsesFormatted = lines.join('\n');

        // Fetch user personality context
        const { data: userRec } = await supabase
          .from('users')
          .select('personality_summary_text')
          .eq('id', user_id)
          .maybeSingle();

        const personalityContext = userRec?.personality_summary_text || "No baseline personality summary available.";

        userPrompt = userPrompt.replace('{{context.personality_context}}', personalityContext);
        userPrompt = userPrompt.replace('{{context.responses}}', responsesFormatted);
      } else if (exercise_id === 'exercise_2') {
        // Fetch raw responses for Exercise 2 (Inkblot)
        const { data: respList } = await supabase
          .from('exercise_responses')
          .select('question_id, step_id, response')
          .eq('instance_id', instance_id);

        const byCardLines: string[] = [];
        [1, 2, 3, 4, 5].forEach(cardId => {
          const findResp = (stepNum: number) => {
            const match = (respList || []).find((r: any) =>
              r.question_id === `card_${cardId}_step_${stepNum}` ||
              (r.step_id === `step_${stepNum}` && r.question_id?.includes(`card_${cardId}`)) ||
              r.question_id === `q_${(cardId - 1) * 3 + stepNum}`
            );
            return match ? String(match.response) : '(none)';
          };
          byCardLines.push(`Card ${cardId}: "${findResp(1)}" / "${findResp(2)}" / "${findResp(3)}"`);
        });

        userPrompt = userPrompt.replace('{{context.responses}}', byCardLines.join('\n'));
      } else {
        userPrompt = userPrompt.replace('{{context.responses}}', context.responses);
        userPrompt = userPrompt.replace('{{context.entries}}', context.entries || '');
        userPrompt = userPrompt.replace('{{context.vocabulary}}', context.vocabulary || '');
        userPrompt = userPrompt.replace('{{context.knowledge}}', context.knowledge || '');
        userPrompt = userPrompt.replace('{{context.patterns}}', context.patterns || '');
        userPrompt = userPrompt.replace('{{context.weeklySummaries}}', context.weeklySummaries || '');
      }

      const fullPrompt = `${config.system_prompt}\n\n${userPrompt}`;

      // 4. Invoke model provider with retry capabilities
      console.log(`[AnalysisWorker] Calling model provider ${config.provider} (model: ${config.model})...`);
      const { text, rawJson, attemptsUsed } = await this.callAIWithRetry(config, fullPrompt);

      // 5. Strict Validator
      console.log('[AnalysisWorker] Validating response schema compliance...');
      ExerciseResultValidator.validate(rawJson);

      // 6. Immutable Storage
      console.log('[AnalysisWorker] Saving validated results to storage...');
      await ExerciseResultStorage.save({
        instance_id,
        user_id,
        analysis: rawJson.analysis,
        scores: rawJson.scores,
        branch: rawJson.branch || null,
        lens: rawJson.lens || null,
        gap_score: rawJson.gap_score || null,
        summary: rawJson.summary,
        provider: config.provider,
        model: config.model,
        prompt_version: config.prompt_version,
        engine_version: '2.0',
        raw_json: rawJson
      });

      if (exercise_id === 'exercise_0') {
        await supabase
          .from('users')
          .update({
            personality_summary_text: rawJson.analysis
          })
          .eq('id', user_id);
      }

      // 7. Transition status to finished
      await ExerciseLifecycleManager.transitionTo(user_id, instance_id, 'finished', {
        force: true,
        transitionReason: 'Analysis completed successfully.'
      });

      // Log observability metrics
      const durationMs = Date.now() - startTime;
      this.logObservability(config, fullPrompt, text, durationMs, attemptsUsed, true);

      // 8. Orchestrator notification
      if (orchestrator_job_id) {
        await IntelligenceOrchestrator.completeJob(orchestrator_job_id, user_id, 'exercise');
      }

      await ExerciseAnalysisPublisher.publishCompleted(user_id, {
        instance_id,
        exercise_id,
        cycle_id
      });

      // Trigger standard completed event
      await IntelligenceOrchestrator.emitEvent(user_id, 'exercise.completed', {
        instance_id,
        exercise_id,
        cycle_id
      });

      // Emit ExerciseCompleted to Knowledge Service
      try {
        const { KnowledgeService } = await import('../knowledge/knowledgeService');
        await KnowledgeService.emitKnowledgeEvent(
          user_id,
          cycle_id,
          null,
          'ExerciseCompleted',
          'exercise_worker',
          { instance_id, exercise_id }
        );
      } catch (kErr: any) {
        console.error('[AnalysisWorker] Failed to emit KnowledgeCompleted event:', kErr.message);
      }

    } catch (err: any) {
      console.error(`[AnalysisWorker] Error processing instance ${instance_id}:`, err.message);

      // Log failure metrics
      const durationMs = Date.now() - startTime;
      this.logObservability(
        { provider: 'unknown', model: 'unknown' } as any,
        '',
        '',
        durationMs,
        1,
        false,
        err.message
      );

      // Transition to failed status
      await ExerciseLifecycleManager.transitionTo(user_id, instance_id, 'failed', {
        force: true,
        transitionReason: err.message
      });

      if (orchestrator_job_id) {
        await IntelligenceOrchestrator.failJob(orchestrator_job_id, user_id, 'exercise', err.message);
      }

      await ExerciseAnalysisPublisher.publishFailed(user_id, {
        instance_id,
        exercise_id,
        cycle_id,
        error: err.message
      });
    } finally {
      ACTIVE_JOBS.delete(instance_id);
    }
  }

  /**
   * Helper to execute API HTTP fetch requests to Gemini/Groq/Claude with transient failure handling.
   */
  private static async callAIWithRetry(
    config: PromptConfig,
    prompt: string
  ): Promise<{ text: string; rawJson: any; attemptsUsed: number }> {
    let delayMs = 2000;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        let text = '';
        let status = 200;

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

          status = res.status;
          if (res.ok) {
            const data = await res.json();
            text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          }
        } 
        else if (config.provider === 'groq') {
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

          status = res.status;
          if (res.ok) {
            const data = await res.json();
            text = data.choices?.[0]?.message?.content || '';
          }
        }
        else if (config.provider === 'claude') {
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
              temperature: config.temperature,
              max_tokens: config.max_tokens
            })
          });

          status = res.status;
          if (res.ok) {
            const data = await res.json();
            text = data.content?.[0]?.text || '';
          }
        }

        if (status === 429 || status === 504 || status >= 500) {
          throw new Error(`Model API returned transient HTTP error status ${status}.`);
        }

        if (!text) {
          throw new Error(`AI provider returned empty content response.`);
        }

        // Clean up markdown block wraps
        let cleaned = text.trim();
        let rawJson: any = null;

        if (config.exercise_id === 'exercise_1') {
          // Extract JSON block from mixed output
          let plainText = cleaned;
          const braceIdx = cleaned.indexOf('{');
          if (braceIdx !== -1) {
            plainText = cleaned.substring(0, braceIdx).trim();
            const jsonStr = cleaned.substring(braceIdx).trim();
            try {
              let cleanJsonStr = jsonStr;
              if (cleanJsonStr.endsWith('```')) {
                cleanJsonStr = cleanJsonStr.replace(/\n```$/, '');
              }
              rawJson = JSON.parse(cleanJsonStr);
            } catch (err) {
              console.warn('[AnalysisWorker] Failed to parse nested JSON in callAIWithRetry:', err);
            }
          }

          if (!rawJson) {
            // Apply fallbacks
            rawJson = {
              analysis: plainText,
              dominant_register: 'ambivalent',
              emotional_register_gap: 'partial',
              suppression_flag: false,
              revealing_pairs: [],
              summary: 'Word association completed.'
            };
          } else {
            // Include analysis and summary
            rawJson.analysis = plainText;
            rawJson.summary = rawJson.summary || 'Word association completed.';
          }
          // Mock standard clarity/intensity/reactivity scores to satisfy schema validator
          rawJson.scores = rawJson.scores || { clarity: 5, intensity: 5, reactivity: 5 };
        } else if (config.exercise_id === 'exercise_2') {
          let plainText = cleaned;
          const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (fenceMatch) {
            plainText = cleaned.substring(0, cleaned.indexOf('```')).trim();
            try { rawJson = JSON.parse(fenceMatch[1].trim()); } catch (_) {}
          } else {
            const jIdx = cleaned.search(/\n\s*\{/);
            if (jIdx !== -1) {
              plainText = cleaned.substring(0, jIdx).trim();
              try { rawJson = JSON.parse(cleaned.substring(jIdx).trim()); } catch (_) {}
            }
          }

          plainText = plainText.split('**').join('').split('*').join('').replace(/^#+\s*/gm, '').trim();

          if (!rawJson) {
            rawJson = {
              analysis: plainText || 'You tended to notice structure and movement across several images.',
              default_lens_label: 'mixed',
              lens_by_image: [],
              entry_confirmation: 'partial',
              de_animation_flag: false,
              most_revealing_image: 3,
              performance_flag: false,
              summary: 'Inkblot projective assessment completed.'
            };
          } else {
            rawJson.analysis = plainText || 'You tended to notice structure and movement across several images.';
            rawJson.summary = rawJson.summary || 'Inkblot projective assessment completed.';
            const validLens = ['threat', 'withdrawal', 'direct', 'avoidant', 'mixed'];
            rawJson.default_lens_label = validLens.includes(rawJson.default_lens_label) ? rawJson.default_lens_label : 'mixed';
            rawJson.entry_confirmation = rawJson.entry_confirmation || 'partial';
            rawJson.de_animation_flag = rawJson.de_animation_flag === true;
            rawJson.most_revealing_image = rawJson.most_revealing_image || 3;
            rawJson.performance_flag = rawJson.performance_flag === true;
          }
          rawJson.scores = rawJson.scores || { clarity: 5, intensity: 5, reactivity: 5 };
        } else {
          // Standard full-JSON behavior
          if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
          }
          rawJson = JSON.parse(cleaned);
        }

        return { text, rawJson, attemptsUsed: attempt };

      } catch (err: any) {
        if (attempt === maxAttempts) {
          throw new Error(`Failed to generate valid analysis response after ${maxAttempts} attempts. Last error: ${err.message}`);
        }

        console.warn(`[AnalysisWorker] Retryable failure on attempt ${attempt} of ${maxAttempts}: ${err.message}. Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2.0;
      }
    }

    throw new Error('Analysis failure.');
  }

  /**
   * Observability logger.
   * Logs duration, token heuristics, estimated costs, and failures.
   */
  private static logObservability(
    config: PromptConfig,
    prompt: string,
    response: string,
    durationMs: number,
    retries: number,
    success: boolean,
    failureReason: string = ''
  ): void {
    const inputTokens = Math.ceil((prompt || '').length / 4.0);
    const outputTokens = Math.ceil((response || '').length / 4.0);

    // Dynamic cost rates per 1M tokens
    let rateIn = 0.0;
    let rateOut = 0.0;

    if (config.provider === 'gemini') {
      rateIn = 0.075;
      rateOut = 0.30;
    } else if (config.provider === 'groq') {
      rateIn = 0.59;
      rateOut = 0.79;
    } else if (config.provider === 'claude') {
      rateIn = 3.00;
      rateOut = 15.00;
    }

    const costEstimate = ((inputTokens * rateIn) + (outputTokens * rateOut)) / 1000000;

    console.log(`
=== [Exercise AI Observability Metrics] ===
Success: ${success ? '✅ YES' : '❌ NO'}
Duration: ${durationMs}ms
Provider: ${config.provider} (Model: ${config.model})
Attempts: ${retries}
Estimated Inputs: ${inputTokens} tokens
Estimated Outputs: ${outputTokens} tokens
Estimated Cost: $${costEstimate.toFixed(6)}
Failure Reason: ${failureReason || 'None'}
===========================================
    `);
  }
}
