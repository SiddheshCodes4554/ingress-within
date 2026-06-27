import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';
import { queueRegistry } from '../registry';

export function validateReflection(text: string): { valid: boolean; reason?: string } {
  const lowercase = text.toLowerCase();
  
  // 1. Forbidden phrases (advice, directives, motivational AI phrases)
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

  // 2. Forbidden diagnostic/therapist labels
  const forbiddenLabels = [
    'disorder',
    'diagnos', // diagnose, diagnosis, diagnostic, etc.
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

export async function processReflectionGeneration(jobData: { entry_id: string; user_id: string }) {
  const { entry_id, user_id } = jobData;

  console.log(`[Reflection Worker] Processing reflection for entry ${entry_id} (user ${user_id})`);

  // 1. Fetch entry
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entry_id)
    .single();

  if (entryError || !entry) {
    throw new Error(`Failed to fetch entry ${entry_id}: ${entryError?.message || 'Not found'}`);
  }

  // 2. Crisis Protocol Suppression Check
  if (entry.crisis_flag || entry.reflection_suppressed) {
    console.log(`[Reflection Worker] Immediate crisis flagged or reflection suppressed for entry ${entry_id}. Suppressing AI generation.`);
    
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
      const { error: updateError } = await supabase
        .from('reflections')
        .update(reflectionPayload)
        .eq('id', existingReflection.id);
      if (updateError) {
        throw new Error(`Failed to update reflection row: ${updateError.message}`);
      }
    } else {
      const { error: insertError } = await supabase
        .from('reflections')
        .insert(reflectionPayload);
      if (insertError) {
        throw new Error(`Failed to insert reflection row: ${insertError.message}`);
      }
    }
    return;
  }

  // 3. Fetch user context
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('personality_summary_text')
    .eq('id', user_id)
    .single();

  const personalityContext = user?.personality_summary_text || undefined;

  // 4. Decrypt text
  const newEntryText = decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv) || entry.content;

  if (!newEntryText || newEntryText.trim() === '') {
    console.log(`[Reflection Worker] Empty text for entry ${entry_id}. Marking reflection as failed.`);
    await supabase
      .from('reflections')
      .update({ status: 'failed', closing_question: null, classification: null })
      .eq('entry_id', entry_id);
    return;
  }

  // Get active provider config
  const providerName = process.env.AI_PROVIDER || 'groq';

  // 5. Retry loop for generation & validation
  let attempts = 0;
  let success = false;
  let result: any = null;
  let validationErrorMsg = '';

  while (attempts < 3 && !success) {
    attempts++;
    console.log(`[Reflection Worker] Generation attempt ${attempts} for entry ${entry_id}`);
    try {
      // If we failed previously, we can slightly alter personalityContext as a hint to AI
      const contextWithRetryFeedback = attempts > 1
        ? `${personalityContext || ''}\n(Correction note: The previous output failed validation. Reason: ${validationErrorMsg}. Please strictly ensure there is no advice, suggestion, or therapeutic label in your response.)`
        : personalityContext;

      result = await aiProvider.generateReflection(newEntryText, contextWithRetryFeedback);
      
      const validation = validateReflection(result.reflection || '');
      if (validation.valid) {
        success = true;
      } else {
        validationErrorMsg = validation.reason || 'Failed validation rules';
        console.warn(`[Reflection Worker] Attempt ${attempts} failed validation: ${validationErrorMsg}`);
      }
    } catch (err: any) {
      validationErrorMsg = err.message || 'AI generation request failed';
      console.error(`[Reflection Worker] Attempt ${attempts} threw error:`, err);
    }
  }

  if (!success) {
    console.error(`[Reflection Worker] All 3 reflection generation attempts failed for entry ${entry_id}. Marking reflection as failed.`);
    
    // Save failed state in reflections table to unblock UI polling
    const { data: existingReflection } = await supabase
      .from('reflections')
      .select('id')
      .eq('entry_id', entry_id)
      .maybeSingle();

    const failedPayload = {
      entry_id,
      user_id,
      cycle_id: entry.cycle_id,
      reflection_text: 'We saved your entry, but could not generate a reflection at this time.',
      closing_question: null,
      classification: null,
      provider: providerName,
      confidence: 'low',
      themes: [],
      status: 'failed',
      generated_at: new Date().toISOString()
    };

    if (existingReflection) {
      await supabase.from('reflections').update(failedPayload).eq('id', existingReflection.id);
    } else {
      await supabase.from('reflections').insert(failedPayload);
    }

    throw new Error(`Reflection generation failed validation rules after 3 attempts: ${validationErrorMsg}`);
  }

  try {
    // 6. Update or insert reflections table
    const { data: existingReflection } = await supabase
      .from('reflections')
      .select('id')
      .eq('entry_id', entry_id)
      .maybeSingle();

    // Programmatically append the fixed closing line exactly
    const fullReflectionText = `${result.reflection.trim()}\n\nSit with that tonight.\nCome back tomorrow and tell me what came up.`;

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

    let reflectionId = existingReflection?.id || null;
    if (existingReflection) {
      const { error: updateError } = await supabase
        .from('reflections')
        .update(reflectionPayload)
        .eq('id', existingReflection.id);

      if (updateError) {
        throw new Error(`Failed to update reflection row: ${updateError.message}`);
      }
    } else {
      const { data: newRefl, error: insertError } = await supabase
        .from('reflections')
        .insert(reflectionPayload)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to insert reflection row: ${insertError.message}`);
      }
      reflectionId = newRefl.id;
    }

    if (reflectionId && reflectionPayload.closing_question) {
      const { data: existingThread, error: threadCheckError } = await supabase
        .from('threads')
        .select('id')
        .eq('reflection_id', reflectionId)
        .maybeSingle();

      if (threadCheckError) {
        console.error(`[Reflection Worker] Error checking existing thread:`, threadCheckError);
      } else if (!existingThread) {
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
          console.error(`[Reflection Worker] Failed to insert thread:`, threadInsertError.message);
        } else {
          console.log(`[Reflection Worker] Created open thread for reflection ${reflectionId}`);
        }
      } else {
        const { error: threadUpdateError } = await supabase
          .from('threads')
          .update({
            closing_question: reflectionPayload.closing_question
          })
          .eq('id', existingThread.id);

        if (threadUpdateError) {
          console.error(`[Reflection Worker] Failed to update thread:`, threadUpdateError.message);
        }
      }
    }

    // Chain sequential pipeline: trigger vocabulary processing next
    try {
      await queueRegistry.addJob('vocab_processing', `vocab_${entry_id}`, {
        entry_id,
        user_id
      });
      console.log(`[Reflection Worker] Chained vocabulary processing job for entry ${entry_id}`);
    } catch (chainErr: any) {
      console.error(`[Reflection Worker] Error queueing vocabulary processing:`, chainErr.message);
    }

    console.log(`[Reflection Worker] Successfully generated and validated reflection for entry ${entry_id} (attempts: ${attempts})`);
  } catch (err: any) {
    console.error(`[Reflection Worker] Error saving reflection to database:`, err);
    throw err;
  }
}
