import { supabase } from '../../db';
import { decrypt } from '../../encryption';
import { executeScoringPipeline } from '../../ai/pipeline';
import { evaluateCrisisLayers } from '../../crisis-detector';
import { queueRegistry } from '../registry';

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

  // 3. Load latest thread response designated for scoring
  const { data: latestResponse, error: latestRespError } = await supabase
    .from('thread_responses')
    .select('response_text')
    .eq('user_id', user_id)
    .eq('used_for_scoring', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestRespError) {
    console.error(`[Entry Scoring Worker] Error fetching latest thread response:`, latestRespError);
  }

  const reflectionText = latestResponse?.response_text || null;
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
  // Hardened with Zod validation, self-healing, retries, and failures logging.
  const activeProvider = process.env.AI_PROVIDER || 'groq';
  const pipelineResult = await executeScoringPipeline(
    hasReflection ? reflectionText : null,
    hasNewEntry ? newEntryText : null,
    personalityContext,
    activeProvider,
    entry_id
  );

  if (!pipelineResult.success || !pipelineResult.scoreResult) {
    const errorMsg = pipelineResult.errorReason || 'AI scoring pipeline failed validation/parsing';
    
    // Update entry status to failed
    await supabase
      .from('entries')
      .update({ 
        scoring_status: 'failed', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', entry_id);

    // Sync to entry_scores with failed status
    const { data: existingScore } = await supabase
      .from('entry_scores')
      .select('id')
      .eq('entry_id', entry_id)
      .maybeSingle();

    const failedPayload = {
      entry_id,
      user_id,
      cycle_id: entry.cycle_id,
      scoring_status: 'failed' as const,
      confidence_reason: errorMsg,
      updated_at: new Date().toISOString()
    };

    if (existingScore) {
      await supabase.from('entry_scores').update(failedPayload).eq('id', existingScore.id);
    } else {
      await supabase.from('entry_scores').insert(failedPayload);
    }

    throw new Error(`[Entry Scoring Worker] Hardened pipeline failed: ${errorMsg}`);
  }

  const scoreResult = pipelineResult.scoreResult;
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

  // STEP 4 — Immediate Layered Crisis Check (Crisis Protocol v2)
  const crisisResult = await evaluateCrisisLayers(
    newEntryText || entry.content,
    activeProvider,
    {
      day_ei,
      day_sa,
      riskLanguageDetected: scoreResult.riskLanguageDetected,
      riskLanguageQuote: scoreResult.riskLanguageQuote
    }
  );

  const isCrisis = crisisResult.crisisFlag;
  const crisis_type = crisisResult.crisisType;

  if (isCrisis && crisis_type) {
    console.warn(`[Entry Scoring Worker] CRITICAL: Immediate crisis detected via layered protocol! Type: ${crisis_type}. Explanation: ${crisisResult.explanation}`);
    
    // Log to crisis_log table with full audit context
    const { error: logError } = await supabase
      .from('crisis_log')
      .insert({
        user_id,
        entry_id,
        cycle_id: entry.cycle_id,
        week_number: Math.ceil((entry.cycle_day || 1) / 7.0),
        journal_date: new Date(entry.created_at).toISOString().split('T')[0],
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
    arc_scoring_note: arcScoringApplied ? 'Arc scoring was applied. Halves of the text were scored independently and their values averaged.' : null,
    scoring_status: 'scored' as const,
    updated_at: new Date().toISOString()
  };

  // Only include crisis-related fields if this scoring run detected a crisis.
  if (isCrisis) {
    scoreData.crisis_flag = true;
    scoreData.crisis_type = crisis_type;
    scoreData.crisis_flagged_at = new Date().toISOString();
    scoreData.reflection_suppressed = true;
    scoreData.risk_language_quote = crisisResult.riskQuote || scoreResult.riskLanguageQuote || null;
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
    arc_scoring_note: _______,
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

  if (entry.cycle_day === 7 || entry.cycle_day === 14 || entry.cycle_day === 21) {
    try {
      const { weeklyReportOrchestrator } = await import('../../weeklyReportOrchestrator');
      await weeklyReportOrchestrator.emitEvent({
        user_id,
        entry_id,
        cycle_id: entry.cycle_id,
        week_number: entry.cycle_day / 7,
        job_name: 'SCORING_COMPLETED',
        completed_at: new Date().toISOString(),
        status: 'success'
      });
    } catch (eventErr: any) {
      console.error(`[Entry Scoring Worker] Error emitting SCORING_COMPLETED event:`, eventErr.message);
    }
  }

  // Chained sequential pipeline: trigger crisis detection next
  try {
    await queueRegistry.addJob('crisis_detection', `crisis_${entry_id}`, {
      entry_id,
      user_id
    });
    console.log(`[Entry Scoring Worker] Chained crisis detection job for entry ${entry_id}`);
  } catch (chainErr: any) {
    console.error(`[Entry Scoring Worker] Error queueing crisis detection:`, chainErr.message);
  }
}

