import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';

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
    // 3. Call AI Provider
    const result = await aiProvider.detectCrisis(entryText);

    const updatePayload: any = {
      crisis_checked: true
    };

    if (result.isCrisis) {
      console.warn(`[Crisis Detection Worker] CRITICAL: Crisis signal detected for user ${user_id}! Reason: ${result.reason}`);
      
      updatePayload.crisis_flag = true;
      updatePayload.crisis_type = 'Risk_Language';
      updatePayload.crisis_flagged_at = new Date().toISOString();
      updatePayload.reflection_suppressed = true;
      updatePayload.risk_language_quote = result.reason || 'AI crisis detection engine match';

      // 4. Log to crisis_log table
      const { error: logError } = await supabase
        .from('crisis_log')
        .insert({
          user_id,
          crisis_type: 'Risk_Language',
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

    console.log(`[Crisis Detection Worker] Scan completed for entry ${entry_id}. isCrisis: ${result.isCrisis}`);
  } catch (err: any) {
    console.error(`[Crisis Detection Worker] Error during crisis detection:`, err);
    throw err;
  }
}
