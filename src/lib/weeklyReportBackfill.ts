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
      const isCycleCompleted = 
        cycle.status?.toLowerCase() === 'complete' || 
        cycle.status?.toLowerCase() === 'completed' ||
        cycle.status?.toLowerCase() === 'archived';
      const currentDay = cycle.current_day || 1;

      for (const target of targetWeeks) {
        // A week is completed if the cycle is completed, or if the current day has passed the week's end day
        const isWeekCompleted = isCycleCompleted || currentDay > target.endDay;
        
        if (!isWeekCompleted) {
          continue; // Week is not yet complete, skip
        }

        result.total_weeks_checked++;

        // Check if a weekly summary already exists in the database (scoped by user_id)
        const { data: summary, error: summaryErr } = await supabase
          .from('weekly_summaries')
          .select('*')
          .eq('cycle_id', cycleId)
          .eq('week_number', target.week)
          .eq('user_id', userId)
          .maybeSingle();

        if (summaryErr) {
          console.error(`[Backfill Orchestrator] Error checking summary for cycle ${cycleId} week ${target.week}:`, summaryErr.message);
          continue;
        }

        if (summary) {
          // Row exists
          if (summary.status === 'READY') {
            // Already successfully generated
            result.already_generated++;
          } else {
            // Check if it's stuck in generating or grace period for > 15 minutes, or failed
            const timeSinceUpdate = Date.now() - new Date(summary.report_data?.orchestration?.updated_at || summary.created_at).getTime();
            const isStuck = (summary.status === 'GENERATING' || summary.status === 'GRACE_PERIOD') && timeSinceUpdate > 15 * 60 * 1000;
            const isFailed = summary.status === 'FAILED';

            if (isFailed || isStuck || !summary.report_data?.orchestration) {
              // Re-trigger/re-enqueue
              result.re_queued_failed++;
              console.log(`[Backfill Orchestrator] Re-queueing failed/stuck summary ${summary.id} (status: ${summary.status}, week: ${target.week}, cycle: ${cycleId})`);

              // Reset status to WAITING_FOR_PROCESSING to re-trigger orchestration
              const initialOrchestration = {
                orchestration: {
                  status: 'WAITING_FOR_PROCESSING',
                  entry_id: summary.report_data?.orchestration?.entry_id || '',
                  completed_events: {
                    'SCORING_COMPLETED': false,
                    'REFLECTION_COMPLETED': false,
                    'CRISIS_COMPLETED': false,
                    'VOCABULARY_COMPLETED': false,
                    'THREADS_COMPLETED': false,
                    'CYCLE_METADATA_UPDATED': false
                  },
                  history: [
                    { stage: 'WAITING_FOR_PROCESSING', timestamp: new Date().toISOString() }
                  ],
                  updated_at: new Date().toISOString()
                }
              };

              await supabase
                .from('weekly_summaries')
                .update({
                  status: 'WAITING_FOR_PROCESSING',
                  report_data: initialOrchestration
                })
                .eq('id', summary.id);

              // Use deterministic jobId to avoid duplicate processing jobs
              await queueRegistry.addJob(
                'weekly_summary_generation',
                `weekly_backfill_${summary.id}`,
                {
                  cycle_id: cycleId,
                  user_id: userId,
                  week_number: target.week,
                  summary_id: summary.id
                },
                `weekly_backfill_${summary.id}` // jobId
              );
            } else {
              // Currently WAITING_FOR_PROCESSING or PENDING (fresh/active)
              result.newly_queued++;
            }
          }
        } else {
          // No row exists -> Create new summary row as PENDING and trigger worker
          result.newly_queued++;
          console.log(`[Backfill Orchestrator] Creating missing weekly summary (Week ${target.week}, Cycle ${cycleId})`);

          const initialOrchestration = {
            orchestration: {
              status: 'WAITING_FOR_PROCESSING',
              entry_id: '',
              completed_events: {
                'SCORING_COMPLETED': false,
                'REFLECTION_COMPLETED': false,
                'CRISIS_COMPLETED': false,
                'VOCABULARY_COMPLETED': false,
                'THREADS_COMPLETED': false,
                'CYCLE_METADATA_UPDATED': false
              },
              history: [
                { stage: 'WAITING_FOR_PROCESSING', timestamp: new Date().toISOString() }
              ],
              updated_at: new Date().toISOString()
            }
          };

          const { data: newSummary, error: insertError } = await supabase
            .from('weekly_summaries')
            .insert({
              user_id: userId,
              cycle_id: cycleId,
              week_number: target.week,
              day_start: target.startDay,
              day_end: target.endDay,
              status: 'PENDING',
              report_data: initialOrchestration
            })
            .select()
            .single();

          if (insertError) {
            console.error(`[Backfill Orchestrator] Failed to insert missing weekly summary:`, insertError.message);
            result.newly_queued--;
          } else if (newSummary) {
            // Add job to validation queue
            await queueRegistry.addJob(
              'weekly_summary_generation',
              `weekly_backfill_${newSummary.id}`,
              {
                cycle_id: cycleId,
                user_id: userId,
                week_number: target.week,
                summary_id: newSummary.id
              },
              `weekly_backfill_${newSummary.id}` // jobId
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
