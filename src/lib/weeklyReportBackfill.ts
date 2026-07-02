import { supabase } from './db';
import { queueRegistry } from './queue/registry';

export interface BackfillResult {
  total_weeks_checked: number;
  already_generated: number;
  newly_queued: number;
  re_queued_failed: number;
}

/**
 * Scans all historical cycles for the user and generates any missing weekly reports.
 * Converges on the same BullMQ worker pipeline used for real-time processing.
 */
export async function backfillWeeklyReports(userId: string): Promise<BackfillResult> {
  console.log(`[Backfill Orchestrator] Starting weekly summary audit for user ${userId}`);
  
  const result: BackfillResult = {
    total_weeks_checked: 0,
    already_generated: 0,
    newly_queued: 0,
    re_queued_failed: 0
  };

  try {
    // 1. Fetch all cycles for this user, ordered chronologically
    const { data: cycles, error: cyclesErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (cyclesErr) {
      console.error('[Backfill Orchestrator] Error fetching user cycles:', cyclesErr.message);
      return result;
    }

    if (!cycles || cycles.length === 0) {
      console.log('[Backfill Orchestrator] No cycles found for user.');
      return result;
    }

    // 2. Loop through each cycle and check completed weeks (Days 7, 14, 21)
    const targetWeeks = [
      { week: 1, startDay: 1, endDay: 7 },
      { week: 2, startDay: 8, endDay: 14 },
      { week: 3, startDay: 15, endDay: 21 }
    ];

    for (const cycle of cycles) {
      const cycleId = cycle.id;
      const isCycleCompleted = cycle.status?.toLowerCase() === 'complete' || cycle.status?.toLowerCase() === 'completed';
      const currentDay = cycle.current_day || 1;

      for (const target of targetWeeks) {
        // A week is completed if the cycle is completed, or if the current day has passed the week's end day
        const isWeekCompleted = isCycleCompleted || currentDay > target.endDay;
        
        if (!isWeekCompleted) {
          continue; // Week is not yet complete, skip
        }

        result.total_weeks_checked++;

        // Check if a weekly summary already exists in the database
        const { data: summary, error: summaryErr } = await supabase
          .from('weekly_summaries')
          .select('*')
          .eq('cycle_id', cycleId)
          .eq('week_number', target.week)
          .maybeSingle();

        if (summaryErr) {
          console.error(`[Backfill Orchestrator] Error checking summary for cycle ${cycleId} week ${target.week}:`, summaryErr.message);
          continue;
        }

        if (summary) {
          // Row exists
          const isPendingAndStale = summary.status === 'pending' && 
            (Date.now() - new Date(summary.created_at).getTime()) > 5 * 60 * 1000;

          if (summary.status === 'ready' && summary.report_data !== null) {
            // Already successfully generated
            result.already_generated++;
          } else if (summary.status === 'failed' || isPendingAndStale || (summary.status !== 'pending' && summary.report_data === null)) {
            // Failed, stale pending, or ungenerated (old format lacking report_data) -> re-trigger
            result.re_queued_failed++;
            console.log(`[Backfill Orchestrator] Re-queueing failed/stale/empty summary ${summary.id} (Week ${target.week}, Cycle ${cycleId})`);
            
            await supabase
              .from('weekly_summaries')
              .update({ status: 'pending' })
              .eq('id', summary.id);

            await queueRegistry.addJob(
              'weekly_summary_generation',
              `weekly_backfill_${summary.id}`,
              {
                cycle_id: cycleId,
                user_id: userId,
                week_number: target.week,
                summary_id: summary.id
              }
            );
          } else {
            // Currently pending and fresh
            result.newly_queued++;
          }
        } else {
          // No row exists -> Create new summary row as pending and trigger worker
          result.newly_queued++;
          console.log(`[Backfill Orchestrator] Creating missing weekly summary (Week ${target.week}, Cycle ${cycleId})`);

          const { data: newSummary, error: insertError } = await supabase
            .from('weekly_summaries')
            .insert({
              user_id: userId,
              cycle_id: cycleId,
              week_number: target.week,
              day_start: target.startDay,
              day_end: target.endDay,
              status: 'pending'
            })
            .select()
            .single();

          if (insertError) {
            console.error(`[Backfill Orchestrator] Failed to insert missing weekly summary:`, insertError.message);
            result.newly_queued--;
          } else if (newSummary) {
            await queueRegistry.addJob(
              'weekly_summary_generation',
              `weekly_backfill_${newSummary.id}`,
              {
                cycle_id: cycleId,
                user_id: userId,
                week_number: target.week,
                summary_id: newSummary.id
              }
            );
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[Backfill Orchestrator] Fatal error during backfill run:', err.message || err);
  }

  console.log(`[Backfill Orchestrator] Audit complete. Checked: ${result.total_weeks_checked}, Ready: ${result.already_generated}, Newly Queued: ${result.newly_queued}, Re-queued: ${result.re_queued_failed}`);
  return result;
}
