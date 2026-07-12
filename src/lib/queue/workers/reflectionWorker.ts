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
  const ei = day_ei !== null ? Number(day_ei) : 5.0;
  const sa = day_sa !== null ? Number(day_sa) : 5.0;
  
  let classification: "Flat" | "Open" | "Scattered" = "Open";
  let reflection = "";
  let closing_question = "";
  let closing_nudge = "";
  let themes: string[] = ["Reflection"];
  
  if (ei >= 7.0 && sa <= 4.0) {
    classification = "Scattered";
    reflection = "Your writing carries a sense of heaviness and fatigue. There is a lot of tension in how you are holding these thoughts today, with several areas of concern demanding your focus.";
    closing_question = "What is one small pressure you can set aside to give yourself some breathing room?";
    closing_nudge = "Take it slow tonight.";
    themes = ["Tension", "Fatigue"];
  } else if (ei <= 4.0 && sa >= 7.0) {
    classification = "Flat";
    reflection = "You seem to be approaching your thoughts with a sense of clarity and ease today. There is a noticeable openness and steady composition in how you describe your experiences.";
    closing_question = "What do you think is supporting this sense of grounding right now?";
    closing_nudge = "Keep leaning into this clarity.";
    themes = ["Clarity", "Grounding"];
  } else {
    classification = "Open";
    reflection = "You are observing your routine and daily events with a neutral, steady focus. It feels like a quiet moment of taking stock of where things stand.";
    closing_question = "What is feeling the most steady or grounding for you in your routine today?";
    closing_nudge = "Be gentle with yourself.";
    themes = ["Balance", "Observation"];
  }
  
  return {
    classification,
    reflection,
    closing_question,
    closing_nudge,
    confidence: "medium",
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
  const providerName = process.env.AI_PROVIDER || 'groq';
  const modelName = (aiProvider as any).model || 'unknown';

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

  // 2. Crisis Protocol Suppression Check
  if (entry.crisis_flag || entry.reflection_suppressed) {
    console.log(`[Reflection Engine] [3/8] [Entry: ${entry_id}] Crisis flagged or reflection suppressed. Logging crisis placeholder and exiting.`);
    
    const { data: existingReflection } = await supabase
      .from('reflections')
      .select('id')
      .eq('entry_id', entry_id)
      .maybeSingle();

    const reflectionPayload = {
      entry_id,
      user_id,
      cycle_id: entry.cycle_id,
      reflection_text: 'Reflection suppressed due to crisis protocol.',
      closing_question: null,
      classification: null,
      provider: 'system',
      confidence: 'low',
      themes: ['Crisis'],
      status: 'failed',
      generated_at: new Date().toISOString()
    };

    if (existingReflection) {
      await supabase.from('reflections').update(reflectionPayload).eq('id', existingReflection.id);
    } else {
      await supabase.from('reflections').insert(reflectionPayload);
    }
    return;
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

  const pendingPayload = {
    entry_id,
    user_id,
    cycle_id: entry.cycle_id,
    reflection_text: 'Processing reflection...',
    closing_question: null,
    classification: null,
    provider: providerName,
    confidence: 'low',
    themes: [],
    status: 'pending',
    generated_at: new Date().toISOString()
  };

  if (existingReflection) {
    await supabase.from('reflections').update(pendingPayload).eq('id', existingReflection.id);
  } else {
    await supabase.from('reflections').insert(pendingPayload);
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

        if (isRateLimit || isTimeout || is5xx) {
          console.warn(`[Reflection Engine] Temporary network/provider error on attempt ${attempts}. Raising BullMQ retry exception.`);
          // Mark status as pending in database so the UI continues polling during retry cooldowns
          await supabase
            .from('reflections')
            .update({ status: 'pending', generated_at: new Date().toISOString() })
            .eq('entry_id', entry_id);
          throw err;
        }
      }
    }
  }

  // 6. Check if all attempts failed, and use local fallback if so
  if (!success) {
    console.warn(`[Reflection Engine] [5/8] [Entry: ${entry_id}] All 3 AI generation attempts failed. Falling back to local deterministic reflection generator.`);
    try {
      result = generateLocalFallbackReflection(newEntryText, entry.day_ei, entry.day_sa);
      success = true;
    } catch (fallbackErr: any) {
      console.error(`[Reflection Engine] Local fallback generation failed:`, fallbackErr.message);
      // Save state as pending to allow background retries later instead of failing permanently.
      await supabase
        .from('reflections')
        .update({
          status: 'pending',
          reflection_text: 'Reflection compiling. We are reviewing style guidelines.',
          generated_at: new Date().toISOString()
        })
        .eq('entry_id', entry_id);
      return;
    }
  }

  console.log(`[Reflection Engine] [6/8] [Entry: ${entry_id}] Reflection observation parsed and validated successfully (attempts: ${attempts}).`);

  // 7. Persist reflection to Supabase
  try {
    const freshRefl = await supabase
      .from('reflections')
      .select('id')
      .eq('entry_id', entry_id)
      .maybeSingle();

    const fullReflectionText = `${result.reflection.trim()}\n\n${(result.closing_nudge || 'Sit with that tonight.\nCome back tomorrow and tell me what came up.').trim()}`;
    const reflectionPayload = {
      entry_id,
      user_id,
      cycle_id: entry.cycle_id,
      reflection_text: fullReflectionText,
      closing_question: result.closing_question,
      classification: result.classification,
      provider: providerName,
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
      if (updateError) throw updateError;
    } else {
      const { data: newRefl, error: insertError } = await supabase
        .from('reflections')
        .insert(reflectionPayload)
        .select()
        .single();
      if (insertError) throw insertError;
      reflectionId = newRefl.id;
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
