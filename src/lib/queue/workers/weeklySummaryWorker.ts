import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';
import crypto from 'crypto';
import { collectWeeklyReportData } from '../../weeklyReportCollector';

export async function processWeeklySummary(jobData: {
  cycle_id: string;
  user_id: string;
  week_number: number;
  summary_id?: string;
  orchestrator_job_id?: string;
}) {
  const { cycle_id, user_id, week_number, summary_id, orchestrator_job_id } = jobData;

  console.log(`[Weekly Summary Worker] Starting weekly summary for week ${week_number} (cycle ${cycle_id})`);

  if (orchestrator_job_id) {
    try {
      const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
      await IntelligenceOrchestrator.startJob(orchestrator_job_id);
    } catch (err: any) {
      console.warn(`[Weekly Summary Worker] Failed to start orchestrator job ${orchestrator_job_id}:`, err.message);
    }
  }

  // 1. Fetch the weekly summary row
  let summaryRow: any = null;
  if (summary_id) {
    const { data, error } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('id', summary_id)
      .single();
    if (!error && data) {
      summaryRow = data;
    }
  }

  if (!summaryRow) {
    // Attempt lookup by cycle_id and week_number
    const { data, error } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('cycle_id', cycle_id)
      .eq('week_number', week_number)
      .maybeSingle();
    
    if (error || !data) {
      throw new Error(`Weekly summary row not found for cycle ${cycle_id} week ${week_number}`);
    }
    summaryRow = data;
  }

  const { id: actualSummaryId, day_start, day_end } = summaryRow;

  // Immutability Guard: Never overwrite a completed report
  if (summaryRow.status === 'READY') {
    console.log(`[Weekly Summary Worker] Weekly report for summary ID ${actualSummaryId} is already READY and immutable. Skipping.`);
    return;
  }

  // 2. Fetch all entries written during this weekly range (joining reflections)
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('*, reflections(*)')
    .eq('cycle_id', cycle_id)
    .eq('user_id', user_id)
    .gte('cycle_day', day_start)
    .lte('cycle_day', day_end)
    .order('cycle_day', { ascending: true });

  if (entriesError) {
    throw new Error(`Failed to fetch entries for weekly summary: ${entriesError.message}`);
  }

  // 2.5. Sustained Distress Pattern Check (Crisis Protocol v1 - Signal 2)
  try {
    const validEntriesForDistress = (entries || []).filter(
      e => e.entry_type !== 'empty' && e.day_ei !== null && e.day_sa !== null
    );
    const hasMinEntries = validEntriesForDistress.length >= 4;
    const current_EI_avg = hasMinEntries
      ? validEntriesForDistress.reduce((sum, e) => sum + Number(e.day_ei), 0) / validEntriesForDistress.length
      : 0;
    const current_SA_avg = hasMinEntries
      ? validEntriesForDistress.reduce((sum, e) => sum + Number(e.day_sa), 0) / validEntriesForDistress.length
      : 10;
    const currentDistress = hasMinEntries && current_EI_avg >= 7 && current_SA_avg <= 3;

    console.log(`[Weekly Summary Worker] Distress Check: Valid entries count = ${validEntriesForDistress.length}, Averages: EI = ${current_EI_avg.toFixed(2)}, SA = ${current_SA_avg.toFixed(2)}. isDistressed = ${currentDistress}`);

    // Fetch current user flag status
    const { data: userRecord } = await supabase
      .from('users')
      .select('sustained_distress_flag')
      .eq('id', user_id)
      .single();
    
    const wasDistressed = userRecord?.sustained_distress_flag || false;
    const todayDateStr = new Date().toISOString().split('T')[0];

    if (currentDistress) {
      console.warn(`[Weekly Summary Worker] Sustained distress triggered for user ${user_id}!`);
      
      await supabase
        .from('users')
        .update({
          sustained_distress_flag: true,
          sustained_distress_since: todayDateStr,
          sustained_distress_cleared_at: null
        })
        .eq('id', user_id);

      if (!wasDistressed) {
        // Log to crisis_log table with full audit context
        const sortedValid = (entries || []).filter(e => e.entry_type !== 'empty');
        const finalEntryId = sortedValid.length > 0 ? sortedValid[sortedValid.length - 1].id : null;

        const { error: logError } = await supabase
          .from('crisis_log')
          .insert({
            user_id,
            entry_id: finalEntryId,
            cycle_id,
            week_number: week_number,
            journal_date: todayDateStr,
            crisis_type: 'Sustained',
            timestamp: new Date().toISOString()
          });
        if (logError) {
          console.error('[Weekly Summary Worker] Failed to insert Sustained log to crisis_log:', logError.message);
        }
      }
    } else if (wasDistressed) {
      // Clear flag after 2 consecutive clean weeks (this week clean + previous week clean)
      let canClear = false;

      if (week_number > 1) {
        // Fetch previous week summary details
        const { data: prevSummary } = await supabase
          .from('weekly_summaries')
          .select('*')
          .eq('cycle_id', cycle_id)
          .eq('week_number', week_number - 1)
          .maybeSingle();

        if (prevSummary) {
          const { data: prevEntries } = await supabase
            .from('entries')
            .select('entry_type, day_ei, day_sa')
            .eq('cycle_id', cycle_id)
            .eq('user_id', user_id)
            .gte('cycle_day', prevSummary.day_start)
            .lte('cycle_day', prevSummary.day_end);

          const validPrev = (prevEntries || []).filter(
            e => e.entry_type !== 'empty' && e.day_ei !== null && e.day_sa !== null
          );
          
          const hasMinPrev = validPrev.length >= 4;
          const prev_EI_avg = hasMinPrev
            ? validPrev.reduce((sum, e) => sum + Number(e.day_ei), 0) / validPrev.length
            : 0;
          const prev_SA_avg = hasMinPrev
            ? validPrev.reduce((sum, e) => sum + Number(e.day_sa), 0) / validPrev.length
            : 10;
          const prevDistress = hasMinPrev && prev_EI_avg >= 7 && prev_SA_avg <= 3;

          // If previous week was not distressed, we have 2 consecutive weeks of non-distress
          if (!prevDistress) {
            canClear = true;
          }
        } else {
          // If no previous week summary exists but week_number > 1, treat as not distressed
          canClear = true;
        }
      }

      if (canClear) {
        console.log(`[Weekly Summary Worker] Clearing sustained distress flag for user ${user_id}.`);
        await supabase
          .from('users')
          .update({
            sustained_distress_flag: false,
            sustained_distress_cleared_at: todayDateStr
          })
          .eq('id', user_id);
      }
    }
  } catch (distressErr: any) {
    console.error(`[Weekly Summary Worker] Error evaluating sustained distress:`, distressErr.message);
  }

  // 3. Gather full structured weekly report data from all-time history
  let collectedData;
  try {
    collectedData = await collectWeeklyReportData({
      userId: user_id,
      cycleId: cycle_id,
      weekNumber: week_number,
      dayStart: day_start,
      dayEnd: day_end
    });
  } catch (err: any) {
    console.error(`[Weekly Summary Worker] Error collecting weekly data:`, err.message);
    await supabase
      .from('weekly_summaries')
      .update({ status: 'FAILED' })
      .eq('id', actualSummaryId);
    throw err;
  }

  if (collectedData.entries.filter(e => e.content.trim().length > 0).length === 0) {
    console.log(`[Weekly Summary Worker] No written entries found for week ${week_number}. Creating graceful READY summary.`);
    await supabase
      .from('weekly_summaries')
      .update({
        status: 'READY',
        body: 'No journal entries were recorded for this week. Your baseline psychological context remains active.',
        open_question: 'What thoughts or reflections would you like to record for the coming week?',
        report_data: {
          entriesCount: 0,
          averages: { ei: null, pr: null, sa: null },
          key_developments: ['No entries recorded during this week.'],
          open_questions: ['What thoughts or reflections would you like to record for the coming week?'],
          vocabThisWeek: []
        }
      })
      .eq('id', actualSummaryId);
    return;
  }

  try {
    // 3.5. Perform source evidence validation before calling AI
    console.log(`[Weekly Summary Worker] Performing source evidence validation for summary ID ${actualSummaryId}...`);
    
    const journalIdsSet = new Set(entries.map(e => e.id));
    
    // A. Every journal belongs to this user.
    const invalidEntries = entries.filter(e => e.user_id !== user_id);
    if (invalidEntries.length > 0) {
      throw new Error(`Integrity Violation: Entry ${invalidEntries[0].id} does not belong to user ${user_id}`);
    }

    // B. Log soft warning if timestamp falls outside UTC week range (since cycle_day is authoritative)
    const auditInfo = collectedData.audit;
    if (auditInfo && auditInfo.week_start && auditInfo.week_end) {
      const weekStart = new Date(auditInfo.week_start + 'T00:00:00.000Z');
      const weekEnd = new Date(auditInfo.week_end + 'T23:59:59.999Z');
      for (const e of entries) {
        const eDate = new Date(e.created_at);
        if (eDate < weekStart || eDate > weekEnd) {
          console.warn(`[Weekly Summary Worker] Note: Entry ${e.id} date (${e.created_at}) extends beyond calendar boundary [${auditInfo.week_start}, ${auditInfo.week_end}] (cycle_day: ${e.cycle_day}).`);
        }
      }
    }

    // C. Every crisis belongs to those journals.
    for (const c of collectedData.crisisEvents) {
      const cEntryId = c.entry_id || c.id;
      if (!cEntryId || !journalIdsSet.has(cEntryId)) {
        throw new Error(`Integrity Violation: Crisis event ${c.id} is not linked to any journal entry of this week (entry ID: ${cEntryId})`);
      }
    }

    // D. Every vocabulary item belongs to those journals.
    for (const src of auditInfo.vocab_sources) {
      if (!journalIdsSet.has(src.entry_id)) {
        throw new Error(`Integrity Violation: Vocabulary source references entry ${src.entry_id} which does not belong to this week's journal entries.`);
      }
    }

    // E. Every score belongs to those journals.
    for (const src of auditInfo.score_sources) {
      if (!journalIdsSet.has(src.entry_id)) {
        throw new Error(`Integrity Violation: Score source references entry ${src.entry_id} which does not belong to this week's journal entries.`);
      }
    }

    console.log(`[Weekly Summary Worker] Data integrity validation passed successfully.`);

    // 3.8. Fetch previous week's top expressions
    let lastWeekTopExpressions: string[] | null = null;
    if (week_number > 1) {
      try {
        const { data: prevSummary } = await supabase
          .from('weekly_summaries')
          .select('report_data')
          .eq('cycle_id', cycle_id)
          .eq('week_number', week_number - 1)
          .eq('user_id', user_id)
          .maybeSingle();

        if (prevSummary && prevSummary.report_data) {
          const prevData = prevSummary.report_data as any;
          if (prevData.since_last_week?.this_week_words) {
            lastWeekTopExpressions = prevData.since_last_week.this_week_words;
          } else if (prevData.vocabThisWeek) {
            lastWeekTopExpressions = prevData.vocabThisWeek.slice(0, 3).map((v: any) => v.word);
          }
        }
      } catch (err: any) {
        console.warn(`[Weekly Summary Worker] Non-fatal error fetching last week's top expressions:`, err.message);
      }
    }

    collectedData.lastWeekTopExpressions = lastWeekTopExpressions;

    // 4. Call AI Provider with fully collected report context
    const aiStartTime = Date.now();
    const result = await aiProvider.generateWeeklyReport(collectedData);

    const actualProvider = (aiProvider as any).lastProviderUsed || process.env.AI_PROVIDER || 'claude';
    const actualModel = (aiProvider as any).model || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    const fallbackUsed = (aiProvider as any).lastFallbackUsed || false;
    const primaryProvider = (aiProvider as any).lastPrimaryProvider || 'claude';

    // Output schema validation
    if (!result || typeof result !== 'object' || !result.what_we_saw || !result.carry_question) {
      throw new Error(`Weekly report validation failed: Missing required narrative or carry question.`);
    }

    const updatedOrchestration = summaryRow.report_data?.orchestration || {};
    updatedOrchestration.status = 'READY';
    updatedOrchestration.completed_at = new Date().toISOString();

    const parts = (result.what_we_saw || '').split('\n\n');
    const sawText = parts[0] || '';
    const realizationText = parts[1] || '';

    // 5. Update weekly_summaries table with the new schema values
    const { error: updateError } = await supabase
      .from('weekly_summaries')
      .update({
        title: result.week_tone || "Weekly Synthesis",
        why: realizationText || sawText || "Narrative insight is ready.",
        body: result.what_we_saw || "A weekly summary is ready.",
        open_question: result.carry_question,
        report_data: {
          ...result,
          weekly_stats: collectedData.weekly_stats,
          writing_behaviour: collectedData.writing_behaviour,
          crisis_review: {
            occurred: collectedData.crisisEvents.length > 0,
            summary: collectedData.crisisEvents.length > 0
              ? `Crisis indicators detected: ${Array.from(new Set(collectedData.crisisEvents.map(e => e.crisis_type))).map((t: any) => t.replace(/_/g, ' ')).join(', ')}`
              : null
          },
          audit: collectedData.audit,
          vocabThisWeek: collectedData.vocabThisWeek,
          orchestration: updatedOrchestration
        },
        status: 'READY',
        engine_version: '2.0',
        prompt_version: '1.0',
        generated_at: new Date().toISOString()
      })
      .eq('id', actualSummaryId);

    if (updateError) {
      throw new Error(`Failed to update weekly summary row: ${updateError.message}`);
    }

    // Record to ai_observability
    try {
      await supabase.from('ai_observability').insert({
        entry_id: actualSummaryId,
        provider: actualProvider,
        raw_provider_response: (aiProvider as any).lastRawResponse || JSON.stringify(result),
        parsed_response: {
          ...result,
          _metadata: {
            module: 'weekly_report',
            summary_id: actualSummaryId,
            cycle_id,
            week_number,
            fallback_used: fallbackUsed,
            primary_provider: primaryProvider,
            usage: (aiProvider as any).lastUsage || null
          }
        },
        validation_result: {
          status: 'passed',
          week_tone: result.week_tone,
          fallback_used: fallbackUsed,
          primary_provider: primaryProvider
        },
        processing_time: Date.now() - aiStartTime,
        retry_count: fallbackUsed ? 1 : 0,
        error_reason: null
      });
    } catch (obsErr) {
      console.warn('[Weekly Summary Worker] Failed to write ai_observability:', obsErr);
    }

    // 6. Create open thread in open_threads (if it doesn't already exist for this summary)
    const { data: existingThread } = await supabase
      .from('open_threads')
      .select('id')
      .eq('source_summary_id', actualSummaryId)
      .maybeSingle();

    if (!existingThread) {
      const threadId = crypto.randomUUID();
      const { error: openThreadError } = await supabase
        .from('open_threads')
        .insert({
          id: threadId,
          user_id,
          cycle_id,
          source_summary_id: actualSummaryId,
          question: result.carry_question,
          origin_context: result.what_we_saw || "A weekly summary.",
          status: 'open',
          created_at: new Date().toISOString()
        });

    }

    if (orchestrator_job_id) {
      try {
        const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
        await IntelligenceOrchestrator.completeJob(orchestrator_job_id, user_id, 'weekly_report', {
          lastProcessedWeek: week_number
        });
      } catch (err: any) {
        console.error(`[Weekly Summary Worker] Failed to complete orchestrator job:`, err.message);
      }
    }

    // Publish WeeklyReportCompleted event to the Event Bus
    try {
      const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
      await IntelligenceOrchestrator.emitEvent(user_id, 'WeeklyReportCompleted', {
        summary_id: actualSummaryId,
        cycle_id,
        week_number
      });
      console.log(`[Weekly Summary Worker] Emitted WeeklyReportCompleted event for user ${user_id}, summary ${actualSummaryId}`);
    } catch (eventErr: any) {
      console.error(`[Weekly Summary Worker] Error emitting WeeklyReportCompleted event:`, eventErr.message);
    }
  } catch (err: any) {
    console.error(`[Weekly Summary Worker] Error in weekly report generation:`, err);
    await supabase
      .from('weekly_summaries')
      .update({ status: 'FAILED' })
      .eq('id', actualSummaryId);

    if (orchestrator_job_id) {
      try {
        const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
        await IntelligenceOrchestrator.failJob(orchestrator_job_id, user_id, 'weekly_report', err.message || String(err));
      } catch (errOrch: any) {
        console.error(`[Weekly Summary Worker] Failed to report failure to orchestrator:`, errOrch.message);
      }
    }
    throw err;
  }
}
