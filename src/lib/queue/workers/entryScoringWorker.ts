import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';

export async function processEntryScoring(jobData: { entry_id: string; user_id: string }) {
  const { entry_id, user_id } = jobData;

  console.log(`[Entry Scoring Worker] Processing entry ${entry_id} for user ${user_id}`);

  // 1. Fetch entry
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entry_id)
    .single();

  if (entryError || !entry) {
    throw new Error(`Failed to fetch entry ${entry_id}: ${entryError?.message || 'Not found'}`);
  }

  // 2. Fetch user context
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('personality_summary_text')
    .eq('id', user_id)
    .single();

  const personalityContext = user?.personality_summary_text || null;

  // 3. Decrypt texts
  const reflectionText = decrypt(entry.reflection_text_encrypted, entry.reflection_text_iv);
  const newEntryText = decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv) || entry.content;

  const hasReflection = !!(reflectionText && reflectionText.trim());
  const hasNewEntry = !!(newEntryText && newEntryText.trim());

  // STEP 1 — Determine entry type
  let entry_type = 'empty';
  if (hasReflection && hasNewEntry) {
    entry_type = 'both';
  } else if (hasNewEntry) {
    entry_type = 'new_only';
  } else if (hasReflection) {
    entry_type = 'reflection_only';
  }

  // If empty, no score. Exclude from all averages.
  if (entry_type === 'empty') {
    console.log(`[Entry Scoring Worker] Entry ${entry_id} has neither reflection nor new entry text. Marking as empty.`);
    const emptyPayload = {
      entry_type: 'empty',
      reflection_ei: null,
      reflection_pr: null,
      reflection_sa: null,
      new_entry_ei: null,
      new_entry_pr: null,
      new_entry_sa: null,
      day_ei: null,
      day_pr: null,
      day_sa: null,
      confidence_flag: false,
      confidence_reason: 'No content written',
      scoring_status: 'scored',
      updated_at: new Date().toISOString()
    };

    const { error: entryUpdateError } = await supabase
      .from('entries')
      .update(emptyPayload)
      .eq('id', entry_id);

    if (entryUpdateError) {
      throw new Error(`Failed to update entry ${entry_id} as empty: ${entryUpdateError.message}`);
    }

    const { data: existingScore } = await supabase
      .from('entry_scores')
      .select('id')
      .eq('entry_id', entry_id)
      .maybeSingle();

    const { entry_type: _, ...emptyPayloadWithoutType } = emptyPayload;

    const scorePayload = {
      entry_id,
      user_id,
      cycle_id: entry.cycle_id,
      ...emptyPayloadWithoutType
    };

    if (existingScore) {
      await supabase.from('entry_scores').update(scorePayload).eq('id', existingScore.id);
    } else {
      await supabase.from('entry_scores').insert(scorePayload);
    }

    return;
  }

  // STEP 2 — AI scores each part present (see Scoring Rubric for AI instructions)
  // Score each part independently before applying weighting
  const scoreResult = await aiProvider.scoreEntryDimensions(
    hasReflection ? reflectionText : null,
    hasNewEntry ? newEntryText : null,
    personalityContext
  );

  const { reflection, newEntry, confidenceFlag, confidenceReason, arcScoringApplied } = scoreResult;

  let day_ei: number | null = null;
  let day_pr: number | null = null;
  let day_sa: number | null = null;
  let confidence_flag = !!confidenceFlag;

  // STEP 3 — Compute weighted day scores
  if (entry_type === 'both') {
    if (!reflection || !newEntry) {
      throw new Error(`AI failed to return independent scores for both reflection and new entry.`);
    }
    day_ei = parseFloat((reflection.ei * 0.25 + newEntry.ei * 0.75).toFixed(2));
    day_pr = parseFloat((reflection.pr * 0.25 + newEntry.pr * 0.75).toFixed(2));
    day_sa = parseFloat((reflection.sa * 0.25 + newEntry.sa * 0.75).toFixed(2));
  } else if (entry_type === 'new_only') {
    if (!newEntry) {
      throw new Error(`AI failed to return scores for new entry.`);
    }
    day_ei = newEntry.ei;
    day_pr = newEntry.pr;
    day_sa = newEntry.sa;
  } else if (entry_type === 'reflection_only') {
    if (!reflection) {
      throw new Error(`AI failed to return scores for reflection.`);
    }
    day_ei = reflection.ei;
    day_pr = reflection.pr;
    day_sa = reflection.sa;
    confidence_flag = true; // Processed content — lower confidence expected
  }

  // STEP 4 — Immediate Crisis Check (Crisis Protocol v1)
  const isImmediateDistress = day_ei !== null && day_sa !== null && day_ei >= 9 && day_sa <= 2;
  const isRiskLanguage = !!scoreResult.riskLanguageDetected;
  const isCrisis = isImmediateDistress || isRiskLanguage;
  const crisis_type = isRiskLanguage ? 'Risk_Language' : (isImmediateDistress ? 'Immediate' : null);

  if (isCrisis && crisis_type) {
    console.warn(`[Entry Scoring Worker] CRITICAL: Immediate crisis detected! Type: ${crisis_type}`);
    
    // Log to crisis_log table
    const { error: logError } = await supabase
      .from('crisis_log')
      .insert({
        user_id,
        crisis_type,
        timestamp: new Date().toISOString()
      });
    if (logError) {
      console.error('[Entry Scoring Worker] Failed to insert to crisis_log:', logError.message);
    }

    // Set user-level active flags for compatibility
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        crisis_flag_active: true,
        crisis_flagged_at: new Date().toISOString()
      })
      .eq('id', user_id);
    if (userUpdateError) {
      console.error('[Entry Scoring Worker] Failed to update user record:', userUpdateError.message);
    }
  }

  // STEP 5 — Store on Entry record & entry_scores record
  const scoreData: any = {
    entry_type,
    reflection_ei: reflection?.ei || null,
    reflection_pr: reflection?.pr || null,
    reflection_sa: reflection?.sa || null,
    new_entry_ei: newEntry?.ei || null,
    new_entry_pr: newEntry?.pr || null,
    new_entry_sa: newEntry?.sa || null,
    day_ei,
    day_pr,
    day_sa,
    confidence_flag,
    confidence_reason: confidenceReason || null,
    arc_scoring_applied: !!arcScoringApplied,
    scoring_status: 'scored' as const,
    updated_at: new Date().toISOString()
  };

  // Only include crisis-related fields if this scoring run detected a crisis.
  // This prevents the scoring worker from overwriting a true crisis flag set by a concurrent crisis worker.
  if (isCrisis) {
    scoreData.crisis_flag = true;
    scoreData.crisis_type = crisis_type;
    scoreData.crisis_flagged_at = new Date().toISOString();
    scoreData.reflection_suppressed = true;
    scoreData.risk_language_quote = isRiskLanguage ? (scoreResult.riskLanguageQuote || null) : null;
  }

  const { error: entryUpdateError } = await supabase
    .from('entries')
    .update(scoreData)
    .eq('id', entry_id);

  if (entryUpdateError) {
    throw new Error(`Failed to update entry ${entry_id}: ${entryUpdateError.message}`);
  }

  // Sync to entry_scores
  const { data: existingScore } = await supabase
    .from('entry_scores')
    .select('id')
    .eq('entry_id', entry_id)
    .maybeSingle();

  // Destructure and omit fields not present in the entry_scores table schema
  const {
    entry_type: _,
    crisis_flag: __,
    crisis_type: ___,
    crisis_flagged_at: ____,
    reflection_suppressed: _____,
    risk_language_quote: ______,
    ...scorePayloadWithoutType
  } = scoreData;

  const scorePayload = {
    entry_id,
    user_id,
    cycle_id: entry.cycle_id,
    ...scorePayloadWithoutType
  };

  if (existingScore) {
    const { error: scoreUpdateError } = await supabase
      .from('entry_scores')
      .update(scorePayload)
      .eq('id', existingScore.id);

    if (scoreUpdateError) {
      throw new Error(`Failed to update entry_scores row: ${scoreUpdateError.message}`);
    }
  } else {
    const { error: scoreInsertError } = await supabase
      .from('entry_scores')
      .insert(scorePayload);

    if (scoreInsertError) {
      throw new Error(`Failed to insert entry_scores row: ${scoreInsertError.message}`);
    }
  }

  console.log(`[Entry Scoring Worker] Successfully scored entry ${entry_id}. Type: ${entry_type}, Day Scores: EI=${day_ei}, PR=${day_pr}, SA=${day_sa}`);
}

