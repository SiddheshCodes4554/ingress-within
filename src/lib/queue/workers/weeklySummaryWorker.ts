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
}) {
  const { cycle_id, user_id, week_number, summary_id } = jobData;

  console.log(`[Weekly Summary Worker] Starting weekly summary for week ${week_number} (cycle ${cycle_id})`);

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
  if (summaryRow.status === 'ready' && summaryRow.report_data !== null) {
    console.log(`[Weekly Summary Worker] Weekly report for summary ID ${actualSummaryId} already exists and is immutable. Skipping.`);
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
        // Log to crisis_log table
        const { error: logError } = await supabase
          .from('crisis_log')
          .insert({
            user_id,
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
      .update({ status: 'failed' })
      .eq('id', actualSummaryId);
    throw err;
  }

  if (collectedData.entries.filter(e => e.content.trim().length > 0).length === 0) {
    console.warn(`[Weekly Summary Worker] No written entries found for week ${week_number}. Marking summary as failed.`);
    await supabase
      .from('weekly_summaries')
      .update({
        status: 'failed',
        body: 'No entries written this week.',
        open_question: 'Please write a journal entry to start.'
      })
      .eq('id', actualSummaryId);
    return;
  }

  try {
    // 4. Call AI Provider with fully collected report context
    const result = await aiProvider.generateWeeklyReport(collectedData);

    // 5. Update weekly_summaries table with full 11-section report_data
    const { error: updateError } = await supabase
      .from('weekly_summaries')
      .update({
        title: result.title || "Composure vs. Suppression",
        why: result.why || "Suppressing internal friction to manage external dynamics.",
        body: result.week_narrative || "A weekly summary is ready.",
        open_question: result.reflection_question,
        report_data: result,
        status: 'ready',
        engine_version: 'v2.0',
        generated_at: new Date().toISOString()
      })
      .eq('id', actualSummaryId);

    if (updateError) {
      throw new Error(`Failed to update weekly summary row: ${updateError.message}`);
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
          question: result.reflection_question,
          origin_context: result.week_narrative || "A weekly summary.",
          status: 'open',
          created_at: new Date().toISOString()
        });

      if (openThreadError) {
        console.warn(`[Weekly Summary Worker] Failed to insert into open_threads:`, openThreadError.message);
      }
    }

    console.log(`[Weekly Summary Worker] Successfully generated weekly report and open thread for week ${week_number}`);
  } catch (err: any) {
    console.error(`[Weekly Summary Worker] Error in weekly report generation:`, err);
    await supabase
      .from('weekly_summaries')
      .update({ status: 'failed' })
      .eq('id', actualSummaryId);
    throw err;
  }
}
