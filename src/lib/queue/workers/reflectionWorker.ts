import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';

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

  // 1.5. Coordination Wait — Ensure both scoring and crisis checks are complete
  if (entry.scoring_status !== 'scored' || !entry.crisis_checked) {
    throw new Error(`Scoring or crisis check not complete yet. Retrying reflection worker. (scoring_status: ${entry.scoring_status}, crisis_checked: ${entry.crisis_checked})`);
  }

  // 1.6. Crisis Protocol Suppression Check
  if (entry.crisis_flag || entry.reflection_suppressed) {
    console.log(`[Reflection Worker] Immediate crisis flagged or reflection suppressed for entry ${entry_id}. Suppressing AI generation.`);
    
    const { data: existingReflection } = await supabase
      .from('reflections')
      .select('id')
      .eq('entry_id', entry_id)
      .maybeSingle();

    const reflectionPayload = {
      entry_id,
      cycle_id: entry.cycle_id,
      observation: 'Reflection suppressed due to crisis protocol.',
      question: null,
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

  // 2. Fetch user context
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('personality_summary_text')
    .eq('id', user_id)
    .single();

  const personalityContext = user?.personality_summary_text || undefined;

  // 3. Decrypt text
  const newEntryText = decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv) || entry.content;

  if (!newEntryText || newEntryText.trim() === '') {
    console.log(`[Reflection Worker] Empty text for entry ${entry_id}. Marking reflection as failed.`);
    await supabase
      .from('reflections')
      .update({ status: 'failed' })
      .eq('entry_id', entry_id);
    return;
  }

  try {
    // 4. Call AI provider
    const result = await aiProvider.generateReflection(newEntryText, personalityContext);

    // 5. Update or insert reflections table
    const { data: existingReflection } = await supabase
      .from('reflections')
      .select('id')
      .eq('entry_id', entry_id)
      .maybeSingle();

    const reflectionPayload = {
      entry_id,
      cycle_id: entry.cycle_id,
      observation: `${result.origin}: ${result.context}`,
      question: result.question,
      status: 'ready',
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

    console.log(`[Reflection Worker] Successfully generated reflection for entry ${entry_id}`);
  } catch (err: any) {
    console.error(`[Reflection Worker] Error during reflection generation for entry ${entry_id}:`, err);
    await supabase
      .from('reflections')
      .update({ status: 'failed' })
      .eq('entry_id', entry_id);
    throw err; // Re-throw to trigger retry policies
  }
}
