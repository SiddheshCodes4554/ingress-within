import { supabase } from '../../db';
import { decrypt } from '../../encryption';
import { evaluateCrisisLayers } from '../../crisis-detector';
import { queueRegistry } from '../registry';

export async function processCrisisDetection(jobData: {
  entry_id: string;
  user_id: string;
}) {
  const { entry_id, user_id } = jobData;

  console.log(`[Crisis Detection Worker] Scanning entry ${entry_id} for user ${user_id}`);

  // 1. Fetch entry
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entry_id)
    .single();

  if (entryError || !entry) {
    throw new Error(`Failed to fetch entry ${entry_id}: ${entryError?.message || 'Not found'}`);
  }

  // 2. Decrypt entry text
  const entryText = decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv) || entry.content;

  if (!entryText || entryText.trim() === '') {
    console.log(`[Crisis Detection Worker] Entry ${entry_id} has empty text. Skipping crisis check.`);
    return;
  }

  try {
    // 3. Call Layered Crisis Detection
    const activeProvider = process.env.AI_PROVIDER || 'groq';
    const result = await evaluateCrisisLayers(
      entryText,
      activeProvider,
      {
        day_ei: entry.day_ei,
        day_sa: entry.day_sa,
        riskLanguageDetected: entry.risk_language_quote ? true : false,
        riskLanguageQuote: entry.risk_language_quote
      }
    );

    const updatePayload: any = {
      crisis_checked: true
    };

    if (result.crisisFlag && result.crisisType) {
      console.warn(`[Crisis Detection Worker] CRITICAL: Crisis signal detected for user ${user_id}! Reason: ${result.explanation}`);
      
      updatePayload.crisis_flag = true;
      updatePayload.crisis_type = result.crisisType;
      updatePayload.crisis_flagged_at = new Date().toISOString();
      updatePayload.reflection_suppressed = true;
      updatePayload.risk_language_quote = result.riskQuote || 'AI crisis detection engine match';

      // 4. Log to crisis_log table
      const { error: logError } = await supabase
        .from('crisis_log')
        .insert({
          user_id,
          crisis_type: result.crisisType,
          timestamp: new Date().toISOString()
        });
      if (logError) {
        console.error('[Crisis Detection Worker] Failed to insert to crisis_log:', logError.message);
      }

      // 5. Update user record
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          crisis_flag_active: true,
          crisis_flagged_at: new Date().toISOString()
        })
        .eq('id', user_id);

      if (userUpdateError) {
        console.error(`[Crisis Detection Worker] Failed to update user record:`, userUpdateError.message);
      }
    }

    // Always update the entry to set crisis_checked = true (and crisis fields if true)
    const { error: entryUpdateError } = await supabase
      .from('entries')
      .update(updatePayload)
      .eq('id', entry_id);

    if (entryUpdateError) {
      throw new Error(`Failed to update entry ${entry_id}: ${entryUpdateError.message}`);
    }

    console.log(`[Crisis Detection Worker] Scan completed for entry ${entry_id}. isCrisis: ${result.crisisFlag}`);

    if (entry.cycle_day === 7 || entry.cycle_day === 14 || entry.cycle_day === 21) {
      try {
        const { weeklyReportOrchestrator } = await import('../../weeklyReportOrchestrator');
        
        await weeklyReportOrchestrator.emitEvent({
          user_id,
          entry_id,
          cycle_id: entry.cycle_id,
          week_number: entry.cycle_day / 7,
          job_name: 'CRISIS_COMPLETED',
          completed_at: new Date().toISOString(),
          status: 'success'
        });

        if (result.crisisFlag) {
          // If crisis is detected, subsequent workers are bypassed.
          // Emit skipped/suppressed events to immediately satisfy the Weekly Report orchestrator.
          const weekNum = entry.cycle_day / 7;
          const skippedEvents: any[] = [
            'REFLECTION_COMPLETED',
            'THREADS_COMPLETED',
            'VOCABULARY_COMPLETED',
            'CYCLE_METADATA_UPDATED'
          ];
          for (const ev of skippedEvents) {
            await weeklyReportOrchestrator.emitEvent({
              user_id,
              entry_id,
              cycle_id: entry.cycle_id,
              week_number: weekNum,
              job_name: ev,
              completed_at: new Date().toISOString(),
              status: 'suppressed'
            });
          }
        }
      } catch (eventErr: any) {
        console.error(`[Crisis Detection Worker] Error emitting events:`, eventErr.message);
      }
    }

    // Sequential Chaining based on Crisis Gating
    if (result.crisisFlag) {
      console.log(`[Crisis Detection Worker] Suppression due to crisis. Setting reflection status to 'failed'.`);
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
    } else {
      // If no crisis, trigger the reflection generation job in queue
      try {
        await queueRegistry.addJob('reflection_generation', `refl_${entry_id}`, {
          entry_id,
          user_id
        });
        console.log(`[Crisis Detection Worker] Chained reflection generation job for entry ${entry_id}`);
      } catch (chainErr: any) {
        console.error(`[Crisis Detection Worker] Error queueing reflection generation:`, chainErr.message);
      }
    }
  } catch (err: any) {
    console.error(`[Crisis Detection Worker] Error during crisis detection:`, err);
    throw err;
  }
}
