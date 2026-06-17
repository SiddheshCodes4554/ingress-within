import { supabase } from '../../db';
import { decrypt } from '../../encryption';
import { evaluateCrisisLayers } from '../../crisis-detector';

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
  } catch (err: any) {
    console.error(`[Crisis Detection Worker] Error during crisis detection:`, err);
    throw err;
  }
}
