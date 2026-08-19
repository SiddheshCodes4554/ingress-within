import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';
import { queueRegistry } from '../registry';

/**
 * Validates a generated reflection observation string against safety guidelines
 * and stylistic constraints. Returns a validation result with error reasons on failure.
 */
export function validateReflection(text: string): { valid: boolean; reason?: string } {
  const lowercase = text.toLowerCase();
  
  // 1. Prohibited advice and suggestion phrases
  const forbiddenPhrases = [
    'you should',
    'try to',
    'consider',
    'remember that',
    'it is important to',
    'you need to',
    'keep in mind',
    'don\'t forget',
    'make sure to',
    'you could',
    'try doing',
    'recommend',
    'suggest',
    'you ought to',
    'it is crucial to',
    'it\'s important to'
  ];

  for (const phrase of forbiddenPhrases) {
    if (lowercase.includes(phrase)) {
      return { valid: false, reason: `Contains advice or prohibited phrase: "${phrase}"` };
    }
  }

  // 2. Prohibited clinical, diagnostic, and therapy labels
  const forbiddenLabels = [
    'disorder',
    'diagnos', // matches diagnose, diagnosis, diagnostic, etc.
    'clinical',
    'therapist',
    'therapy',
    'patient',
    'treatment',
    'depression',
    'bipolar',
    'borderline',
    'ptsd',
    'adhd',
    'schiz'
  ];

  for (const label of forbiddenLabels) {
    if (lowercase.includes(label)) {
      return { valid: false, reason: `Contains diagnostic or therapeutic label: "${label}"` };
    }
  }

  // 3. Word count check for the observation text: 10 to 100 words
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 100) {
    return { valid: false, reason: `Reflection text is too long (${wordCount} words, max 100)` };
  }
  if (wordCount < 10) {
    return { valid: false, reason: `Reflection text is too short (${wordCount} words, min 10)` };
  }

  // 4. Must address the user using "you" or "your"
  if (!lowercase.includes('you') && !lowercase.includes('your')) {
    return { valid: false, reason: 'Does not address the user directly using "you" or "your"' };
  }

  return { valid: true };
}

export function generateLocalFallbackReflection(
  entryText: string,
  day_ei: number | null,
  day_sa: number | null
): {
  classification: "Flat" | "Open" | "Scattered";
  reflection: string;
  closing_nudge: string;
  closing_question: string;
  confidence: "high" | "medium" | "low";
  themes: string[];
} {
  const rawText = entryText || '';
  const text = rawText.toLowerCase();

  // Create text seed hash so different entries get different questions
  let hash = 0;
  for (let i = 0; i < rawText.length; i++) {
    hash = (hash << 5) - hash + rawText.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  // Keyword & Sentiment Analysis
  const hasExhaustion = text.includes('heavy') || text.includes('exhaust') || text.includes('weight') || text.includes('tired') || text.includes('burden') || text.includes('holding together') || text.includes('energy') || text.includes('hopeless') || text.includes('dread') || text.includes('heaviness');
  const hasAvoidance = text.includes('avoid') || text.includes('quiet') || text.includes('alone') || text.includes('hide') || text.includes('pretend') || text.includes('mask') || text.includes('explain') || text.includes('fine') || text.includes('snapped');
  const hasAnxiety = text.includes('anxious') || text.includes('worry') || text.includes('panic') || text.includes('scared') || text.includes('future') || text.includes('mind') || text.includes('overwhelmed') || text.includes('first') || text.includes('present') || text.includes('work');
  const hasBoundary = text.includes('yes') || text.includes('coworker') || text.includes('agree') || text.includes('boundary') || text.includes('people') || text.includes('saying no');
  
  let classification: "Flat" | "Open" | "Scattered" = "Scattered";
  let reflection = "";
  let closing_question = "";
  let closing_nudge = "";
  let themes: string[] = [];

  const boundaryQuestions = [
    "When you notice yourself agreeing to take on extra weight, what boundary is your inner voice asking you to protect?",
    "Where in your day could you reclaim 10 minutes that belong entirely to your own replenishment?",
    "If saying no were an act of self-preservation rather than disappointment, how would your schedule change tomorrow?",
    "What is one commitment you are carrying right now that you can step back from without feeling guilty?"
  ];

  const exhaustionQuestions = [
    "If you allowed yourself to pause trying to hold everything together tonight, what is the smallest thing that would give your body true rest?",
    "What part of the weight you carried today can you leave behind before you go to sleep?",
    "When your energy is depleted, what kind of stillness restores your peace most deeply?",
    "What is your mind or body signaling that it needs right now to feel supported?"
  ];

  const anxietyQuestions = [
    "What is one expectation or worry about tomorrow that you can gently set aside for the rest of today?",
    "Looking closely at what triggered your mind today, what part of this situation is actually within your control right now?",
    "If you trusted that things would unfold step by step, how would your breath feel in this moment?",
    "What assumption about the future is taking up the most mental space, and can you let it rest tonight?"
  ];

  const openQuestions = [
    "What is feeling the most steady or grounding for you as you observe your day in hindsight?",
    "What insight about yourself becomes clearer when you sit quietly with today's events?",
    "What shift in your internal rhythm did you notice most clearly while writing today?",
    "What experience from today deserves a moment of quiet appreciation before the day ends?"
  ];

  if (hasBoundary) {
    classification = "Scattered";
    themes = ["Boundaries", "Self-Advocacy", "Energy Management"];
    reflection = `You highlighted a dynamic around boundaries and overcommitting, observing how reflexively taking on responsibilities creates tension between your desire to support others and your own energy capacity.\n\nNoticing this pattern is the first step toward intentional choice. Protecting your space isn't selfish; it allows you to show up with genuine presence.`;
    closing_question = boundaryQuestions[seed % boundaryQuestions.length];
    closing_nudge = "Protect your peace tonight.";
  } else if (hasExhaustion || hasAvoidance) {
    classification = "Scattered";
    themes = ["Emotional Exhaustion", "Self-Preservation", "Vulnerability"];
    reflection = `You described carrying a sense of fatigue today, expressing how challenging it feels when energy is depleted and demands remain high.\n\nThere is quiet strength in acknowledging this fatigue rather than masking it. Navigating low-energy moments with self-compassion guards your remaining capacity.`;
    closing_question = exhaustionQuestions[seed % exhaustionQuestions.length];
    closing_nudge = "Be deeply gentle with yourself tonight.";
  } else if (hasAnxiety) {
    classification = "Scattered";
    themes = ["Anxiety Pattern", "Uncertainty", "Overthinking"];
    reflection = `Your writing captures internal pressure around upcoming demands or uncertainty, where your mind is trying to anticipate outcomes.\n\nSimply naming this pattern creates space between your core self and the urgency of the thought. You don't have to resolve everything tonight.`;
    closing_question = anxietyQuestions[seed % anxietyQuestions.length];
    closing_nudge = "Breathe into this moment.";
  } else {
    classification = "Open";
    themes = ["Self-Awareness", "Clarity", "Observation"];
    reflection = `You examined your daily experiences with steady attention. Putting these reflections into words creates clarity out of quiet, implicit feelings.\n\nNotice how giving yourself space to write allows you to process where your energy is naturally settling without needing to immediately fix or change anything.`;
    closing_question = openQuestions[seed % openQuestions.length];
    closing_nudge = "Hold onto this moment of awareness.";
  }

  return {
    classification,
    reflection,
    closing_question,
    closing_nudge,
    confidence: "high",
    themes
  };
}

/**
 * BullMQ Worker job handler to generate clinical observations and reflections 
 * for saved journal entries. Runs in the background and implements self-healing retries.
 */
export async function processReflectionGeneration(jobData: {
  entry_id: string;
  user_id: string;
  bypass_ai?: boolean;
  orchestrator_job_id?: string;
}) {
  const { entry_id, user_id, bypass_ai, orchestrator_job_id } = jobData;
  const startTime = Date.now();
  const providerName = process.env.AI_PROVIDER || 'claude';
  const modelName = (aiProvider as any).model || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';

  console.log(`[Reflection Engine] [1/8] [Entry: ${entry_id}] Starting reflection pipeline. Provider: ${providerName}, Model: ${modelName}`);

  if (orchestrator_job_id) {
    try {
      const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
      await IntelligenceOrchestrator.startJob(orchestrator_job_id);
    } catch (err: any) {
      console.warn(`[Reflection Engine] Failed to start orchestrator job ${orchestrator_job_id}:`, err.message);
    }
  }

  // 1. Fetch entry
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entry_id)
    .single();

  if (entryError || !entry) {
    console.error(`[Reflection Engine] [1/8] Failed to fetch entry ${entry_id} from Supabase:`, entryError?.message);
    throw new Error(`Failed to fetch entry ${entry_id}: ${entryError?.message || 'Not found'}`);
  }

  // Idempotency: Skip if reflection is already generated and ready
  const { data: existingRefl } = await supabase
    .from('reflections')
    .select('status')
    .eq('entry_id', entry_id)
    .maybeSingle();

  if (existingRefl && existingRefl.status === 'ready') {
    console.log(`[Reflection Engine] [Entry: ${entry_id}] Reflection already generated and ready. Skipping.`);
    if (orchestrator_job_id) {
      try {
        const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
        await IntelligenceOrchestrator.completeJob(orchestrator_job_id, user_id, 'reflection', {
          lastProcessedEntry: entry_id
        });
      } catch (err: any) {
        console.error(`[Reflection Engine] Failed to complete orchestrator job:`, err.message);
      }
    }
    return;
  }

  // 2. Crisis Protocol Check (Reflection generated for all entries including crisis)
  if (entry.crisis_flag) {
    console.log(`[Reflection Engine] [Entry: ${entry_id}] Crisis flagged entry. Generating supportive crisis reflection observation.`);
  }

  // 3. Decrypt text
  const newEntryText = decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv) || entry.content;

  if (!newEntryText || newEntryText.trim() === '') {
    console.warn(`[Reflection Engine] [2/8] Empty journal content for entry ${entry_id}. Marking as failed.`);
    await supabase
      .from('reflections')
      .insert({
        entry_id,
        user_id,
        cycle_id: entry.cycle_id,
        reflection_text: 'Empty entry content.',
        closing_question: null,
        classification: null,
        provider: providerName,
        confidence: 'low',
        themes: [],
        status: 'failed',
        generated_at: new Date().toISOString()
      });
    return;
  }

  console.log(`[Reflection Engine] [2/8] [Entry: ${entry_id}] Decrypted journal content successfully (${newEntryText.length} characters, ~${Math.round(newEntryText.split(/\s+/).length)} words).`);

  // 4. Fetch Context (personality, latest completed thread response, previous reflection)
  console.log(`[Reflection Engine] [4/8] [Entry: ${entry_id}] Fetching user personality and previous contexts...`);
  
  const { data: user } = await supabase
    .from('users')
    .select('personality_summary_text')
    .eq('id', user_id)
    .single();
  const personalityContext = user?.personality_summary_text || undefined;

  // Fetch latest completed thread response
  const { data: latestThreadResponse } = await supabase
    .from('thread_responses')
    .select('response_text, created_at, thread_id')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let threadContext = 'None';
  if (latestThreadResponse) {
    const { data: thread } = await supabase
      .from('threads')
      .select('closing_question')
      .eq('id', latestThreadResponse.thread_id)
      .maybeSingle();
    if (thread) {
      threadContext = `Question: "${thread.closing_question}" | Answer: "${latestThreadResponse.response_text}"`;
    }
  }

  // Fetch previous reflection context
  const { data: latestReflection } = await supabase
    .from('reflections')
    .select('reflection_text, closing_question')
    .eq('user_id', user_id)
    .eq('status', 'ready')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let previousReflectionContext = 'None';
  if (latestReflection) {
    previousReflectionContext = `Observation: "${latestReflection.reflection_text}" | Question: "${latestReflection.closing_question}"`;
  }

  console.log(`[Reflection Engine] [4/8] [Entry: ${entry_id}] Context gathered. Personality summary: ${personalityContext ? 'Present' : 'None'}, Latest thread: ${threadContext !== 'None' ? 'Present' : 'None'}, Previous reflection: ${previousReflectionContext !== 'None' ? 'Present' : 'None'}`);

  // Create or update a pending reflection row so the UI is unblocked
  const { data: existingReflection } = await supabase
    .from('reflections')
    .select('id')
    .eq('entry_id', entry_id)
    .maybeSingle();

  const initialFallback = generateLocalFallbackReflection(newEntryText, entry.day_ei, entry.day_sa);
  const initialText = `${initialFallback.reflection.trim()}\n\n${(initialFallback.closing_nudge || 'Be gentle with yourself.').trim()}`;

  const initialReadyPayload: any = {
    entry_id,
    user_id,
    cycle_id: entry.cycle_id,
    reflection_text: initialText,
    closing_question: initialFallback.closing_question,
    classification: initialFallback.classification,
    provider: providerName,
    confidence: 'medium',
    themes: initialFallback.themes || [],
    status: 'ready',
    generated_at: new Date().toISOString()
  };

  try {
    if (existingReflection) {
      await supabase.from('reflections').update(initialReadyPayload).eq('id', existingReflection.id);
    } else {
      await supabase.from('reflections').insert(initialReadyPayload);
    }
  } catch (initSaveErr: any) {
    console.warn('[Reflection Engine] Failed to save initial ready payload:', initSaveErr?.message);
  }

  // 5. Generation/Validation loop
  let attempts = 0;
  let success = false;
  let result: any = null;
  let validationErrorMsg = '';

  if (bypass_ai) {
    console.log(`[Reflection Engine] [5/8] [Entry: ${entry_id}] Bypassing AI generation. Generating local fallback reflection.`);
    result = generateLocalFallbackReflection(newEntryText, entry.day_ei, entry.day_sa);
    success = true;
  } else {
    while (attempts < 3 && !success) {
      attempts++;
      console.log(`[Reflection Engine] [5/8] [Entry: ${entry_id}] Generation attempt ${attempts} of 3. Simplified mode: ${attempts === 3}`);
      
      // Attempt 3 uses the relaxed simplified prompt mode for self-healing
      const useSimplifiedPrompt = attempts === 3;
      const contextWithRetryFeedback = attempts === 2
        ? `${personalityContext || ''}\n(Correction note: The previous output failed validation. Reason: ${validationErrorMsg}. Please strictly ensure there is no advice, suggestion, or therapeutic label in your response.)`
        : personalityContext;

      try {
        result = await aiProvider.generateReflection(
          newEntryText,
          contextWithRetryFeedback,
          threadContext,
          previousReflectionContext,
          useSimplifiedPrompt
        );

        if (!result) {
          throw new Error('AI Provider returned null or empty result.');
        }

        // Output Validation Checks
        if (!result.reflection || result.reflection.trim() === '') {
          throw new Error('AI response is missing "reflection" observation text.');
        }
        if (!result.closing_question || result.closing_question.trim() === '') {
          throw new Error('AI response is missing "closing_question".');
        }
        if (!result.classification) {
          throw new Error('AI response is missing "classification" pattern.');
        }

        // Run forbidden words and word count validator
        const validation = validateReflection(result.reflection);
        if (validation.valid) {
          success = true;
        } else {
          validationErrorMsg = validation.reason || 'Failed style validation guidelines.';
          console.warn(`[Reflection Engine] [5/8] [Entry: ${entry_id}] Attempt ${attempts} failed validation: ${validationErrorMsg}`);
        }
      } catch (err: any) {
        validationErrorMsg = err.message || 'Generation request threw an exception.';
        console.error(`[Reflection Engine] [5/8] [Entry: ${entry_id}] Attempt ${attempts} caught error:`, err.message || err);

        // Handle Rate limits (429), timeouts, and server errors (5xx) by raising BullMQ exception for exponential backoff retry
        const isRateLimit = err.message?.includes('429') || err.message?.toLowerCase().includes('rate limit');
        const isTimeout = err.message?.toLowerCase().includes('timeout') || err.message?.toLowerCase().includes('etimedout');
        const is5xx = err.message?.includes('500') || err.message?.includes('502') || err.message?.includes('503') || err.message?.includes('504') || err.message?.includes('HTTP error 5');

        if (isRateLimit || isTimeout || is5xx || attempts >= 2) {
          console.warn(`[Reflection Engine] Network/provider error or rate limit on attempt ${attempts}. Falling back to deterministic local reflection generator.`);
          result = generateLocalFallbackReflection(newEntryText, entry.day_ei, entry.day_sa);
          success = true;
          break;
        }
      }
    }
  }

  // 6. Check if all attempts failed, and use local fallback if so
  if (!success || !result) {
    console.warn(`[Reflection Engine] AI generation unfulfilled. Falling back to local deterministic reflection generator.`);
    result = generateLocalFallbackReflection(newEntryText, entry.day_ei, entry.day_sa);
    success = true;
  }

  console.log(`[Reflection Engine] [6/8] [Entry: ${entry_id}] Reflection observation parsed and validated successfully (attempts: ${attempts}).`);

  // 7. Persist reflection to Supabase
  try {
    const freshRefl = await supabase
      .from('reflections')
      .select('id')
      .eq('entry_id', entry_id)
      .maybeSingle();

    let cycleId = entry.cycle_id;
    if (!cycleId) {
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('id')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      cycleId = activeCycle?.id || null;
    }

    const actualProvider = (aiProvider as any).lastProviderUsed || providerName;
    const fallbackUsed = (aiProvider as any).lastFallbackUsed || false;
    const primaryProvider = (aiProvider as any).lastPrimaryProvider || 'claude';
    const usage = (aiProvider as any).lastUsage || null;

    const fullReflectionText = `${result.reflection.trim()}\n\n${(result.closing_nudge || 'Sit with that tonight.\nCome back tomorrow and tell me what came up.').trim()}`;
    const reflectionPayload: any = {
      entry_id,
      user_id,
      cycle_id: cycleId,
      reflection_text: fullReflectionText,
      closing_question: result.closing_question,
      classification: result.classification,
      provider: actualProvider,
      confidence: result.confidence || 'high',
      themes: result.themes || [],
      status: 'ready',
      generated_at: new Date().toISOString()
    };

    let reflectionId = freshRefl.data?.id || null;

    if (freshRefl.data) {
      const { error: updateError } = await supabase
        .from('reflections')
        .update(reflectionPayload)
        .eq('id', freshRefl.data.id);
      if (updateError) {
        console.warn(`[Reflection Engine] Update failed (${updateError.message}), retrying...`);
        const { error: retryError } = await supabase
          .from('reflections')
          .update(reflectionPayload)
          .eq('id', freshRefl.data.id);
        if (retryError) throw retryError;
      }
    } else {
      const { data: newRefl, error: insertError } = await supabase
        .from('reflections')
        .insert(reflectionPayload)
        .select()
        .single();
      if (insertError) {
        console.warn(`[Reflection Engine] Insert failed (${insertError.message}), retrying...`);
        const { data: retryRefl, error: retryInsertErr } = await supabase
          .from('reflections')
          .insert(reflectionPayload)
          .select()
          .single();
        if (retryInsertErr) throw retryInsertErr;
        if (retryRefl) reflectionId = retryRefl.id;
      } else if (newRefl) {
        reflectionId = newRefl.id;
      }
    }

    // Persist to ai_observability table
    try {
      await supabase.from('ai_observability').insert({
        entry_id,
        provider: actualProvider,
        raw_provider_response: (aiProvider as any).lastRawResponse || JSON.stringify(result),
        parsed_response: {
          ...result,
          _metadata: {
            fallback_used: fallbackUsed,
            primary_provider: primaryProvider,
            usage
          }
        },
        validation_result: {
          status: 'passed',
          fallback_used: fallbackUsed,
          primary_provider: primaryProvider
        },
        processing_time: Date.now() - startTime,
        retry_count: attempts - 1,
        error_reason: null
      });
    } catch (obsErr) {
      console.warn('[Reflection Engine] Failed to write to ai_observability:', obsErr);
    }

    console.log(`[Reflection Engine] [7/8] [Entry: ${entry_id}] Saved reflection observation to Supabase reflections table.`);

    // Emit ReflectionGenerated event
    try {
      const { KnowledgeService } = await import('../../knowledge/knowledgeService');
      await KnowledgeService.emitKnowledgeEvent(
        user_id,
        entry.cycle_id,
        entry_id,
        'ReflectionGenerated',
        'reflection_engine',
        { reflection_id: reflectionId }
      );
    } catch (reflErr: any) {
      console.error(`[Reflection Engine] Failed to emit ReflectionGenerated event:`, reflErr.message);
    }

    if (entry.cycle_day === 7 || entry.cycle_day === 14 || entry.cycle_day === 21) {
      try {
        const { weeklyReportOrchestrator } = await import('../../weeklyReportOrchestrator');
        await weeklyReportOrchestrator.emitEvent({
          user_id,
          entry_id,
          cycle_id: entry.cycle_id,
          week_number: entry.cycle_day / 7,
          job_name: 'REFLECTION_COMPLETED',
          completed_at: new Date().toISOString(),
          status: 'success'
        });
      } catch (eventErr: any) {
        console.error(`[Reflection Engine] Error emitting REFLECTION_COMPLETED event:`, eventErr.message);
      }
    }

    // 8. Handle reflection thread creation
    if (reflectionId && reflectionPayload.closing_question) {
      const { data: existingThread } = await supabase
        .from('threads')
        .select('id')
        .eq('reflection_id', reflectionId)
        .maybeSingle();

      if (!existingThread) {
        const { error: threadInsertError } = await supabase
          .from('threads')
          .insert({
            user_id,
            cycle_id: entry.cycle_id,
            reflection_id: reflectionId,
            closing_question: reflectionPayload.closing_question,
            status: 'Open'
          });
        if (threadInsertError) {
          console.error(`[Reflection Engine] Failed to insert thread:`, threadInsertError.message);
        } else {
          console.log(`[Reflection Engine] Created open thread for reflection ${reflectionId}`);
        }
      } else {
        await supabase
          .from('threads')
          .update({ closing_question: reflectionPayload.closing_question })
          .eq('id', existingThread.id);
      }
    }

    if (entry.cycle_day === 7 || entry.cycle_day === 14 || entry.cycle_day === 21) {
      try {
        const { weeklyReportOrchestrator } = await import('../../weeklyReportOrchestrator');
        await weeklyReportOrchestrator.emitEvent({
          user_id,
          entry_id,
          cycle_id: entry.cycle_id,
          week_number: entry.cycle_day / 7,
          job_name: 'THREADS_COMPLETED',
          completed_at: new Date().toISOString(),
          status: 'success'
        });
      } catch (eventErr: any) {
        console.error(`[Reflection Engine] Error emitting THREADS_COMPLETED event:`, eventErr.message);
      }
    }

    if (orchestrator_job_id) {
      try {
        const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
        await IntelligenceOrchestrator.completeJob(orchestrator_job_id, user_id, 'reflection', {
          lastProcessedEntry: entry_id
        });
      } catch (err: any) {
        console.error(`[Reflection Engine] Failed to complete orchestrator job:`, err.message);
      }
    }

    // Publish ReflectionCompleted event to the Event Bus
    try {
      const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
      await IntelligenceOrchestrator.emitEvent(user_id, 'ReflectionCompleted', {
        entry_id,
        cycle_id: entry.cycle_id
      });
      console.log(`[Reflection Engine] Emitted ReflectionCompleted event for entry ${entry_id}`);
    } catch (eventErr: any) {
      console.error(`[Reflection Engine] Error emitting ReflectionCompleted event:`, eventErr.message);
    }

    const duration = Date.now() - startTime;
    console.log(`[Reflection Engine] Successfully completed reflection generation for entry ${entry_id} in ${duration}ms.`);
  } catch (err: any) {
    console.error(`[Reflection Engine] [7/8] Error saving reflection to database:`, err.message || err);
    if (orchestrator_job_id) {
      try {
        const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
        await IntelligenceOrchestrator.failJob(orchestrator_job_id, user_id, 'reflection', err.message || String(err));
      } catch (errOrch: any) {
        console.error(`[Reflection Engine] Failed to report failure to orchestrator:`, errOrch.message);
      }
    }
    throw err;
  }
}
