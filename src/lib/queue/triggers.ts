import { supabase } from '../db';
import { queueRegistry } from './registry';

export async function triggerAIProcessing(entryId: string, userId: string) {
  console.log(`[Queue Trigger] Enqueueing background jobs for entry ${entryId}`);
  try {
    await queueRegistry.addJob('entry_scoring', `score_${entryId}`, {
      entry_id: entryId,
      user_id: userId
    });

    // Emit JournalCreated event
    const { data: entry } = await supabase
      .from('entries')
      .select('cycle_id, cycle_day')
      .eq('id', entryId)
      .maybeSingle();

    const { KnowledgeService } = await import('../knowledge/knowledgeService');
    await KnowledgeService.emitKnowledgeEvent(
      userId,
      entry?.cycle_id || null,
      entryId,
      'JournalCreated',
      'journal',
      { entry_id: entryId, cycle_day: entry?.cycle_day }
    );
  } catch (err: any) {
    console.error(`[Queue Trigger] Error queueing AI processing jobs for entry ${entryId}:`, err.message);
  }
}

export async function triggerPatternProcessing(
  entryId: string | null,
  userId: string,
  cycleId: string,
  sourceType: 'journal' | 'thread' | 'vocab' | 'weekly_report'
) {
  console.log(`[Queue Trigger] Enqueueing pattern processing job for user ${userId}, source: ${sourceType}, entry/source ID: ${entryId}`);
  try {
    const jobId = entryId ? `pattern_${sourceType}_${entryId}` : `pattern_${sourceType}_${Date.now()}`;
    await queueRegistry.addJob('pattern_processing', jobId, {
      entry_id: entryId || undefined,
      user_id: userId,
      cycle_id: cycleId,
      source_type: sourceType
    });
  } catch (err: any) {
    console.error(`[Queue Trigger] Error queueing pattern processing job:`, err.message);
  }
}

export async function checkWeeklyAndMonthlySummary(userId: string, cycleId: string | null, cycleDay: number) {
  if (!cycleId) return;

  console.log(`[Queue Trigger] Checking cycle day milestones for user ${userId}, day ${cycleDay}`);

  // 1. Check Weekly Summaries (Trigger Week 1 at Day 8+, Week 2 at Day 15+, Week 3 at Day 22+)
  const weeksToCheck = [
    { weekNum: 1, triggerDay: 8, startDay: 1, endDay: 7 },
    { weekNum: 2, triggerDay: 15, startDay: 8, endDay: 14 },
    { weekNum: 3, triggerDay: 22, startDay: 15, endDay: 21 }
  ];

  for (const w of weeksToCheck) {
    if (cycleDay >= w.triggerDay) {
      try {
        const { data: existing } = await supabase
          .from('weekly_summaries')
          .select('id, status')
          .eq('cycle_id', cycleId)
          .eq('week_number', w.weekNum)
          .maybeSingle();

        if (!existing || existing.status === 'FAILED' || existing.status === 'failed') {
          // Query the final entry in the week's day range to associate with orchestration state
          const { data: entry } = await supabase
            .from('entries')
            .select('id')
            .eq('cycle_id', cycleId)
            .gte('cycle_day', w.startDay)
            .lte('cycle_day', w.endDay)
            .order('cycle_day', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!entry) {
            console.log(`[Queue Trigger] No entries found for Week ${w.weekNum} in range [${w.startDay}, ${w.endDay}]. Skipping.`);
            continue;
          }

          const entryId = entry.id;

          const initialOrchestration = {
            orchestration: {
              status: 'WAITING_FOR_PROCESSING',
              entry_id: entryId,
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

          let targetSummaryId = existing?.id || '';

          if (!existing) {
            const { data: summary, error: insertError } = await supabase
              .from('weekly_summaries')
              .insert({
                user_id: userId,
                cycle_id: cycleId,
                week_number: w.weekNum,
                day_start: w.startDay,
                day_end: w.endDay,
                status: 'PENDING',
                report_data: initialOrchestration
              })
              .select()
              .single();

            if (insertError) {
              console.error(`[Queue Trigger] Failed to insert weekly_summaries row for Week ${w.weekNum}:`, insertError.message);
            } else if (summary) {
              targetSummaryId = summary.id;
              console.log(`[Queue Trigger] Created weekly summary row ${summary.id} for Week ${w.weekNum} in status PENDING. Triggering validation...`);
            }
          } else {
            // Reset existing failed summary to PENDING to allow re-triggering
            const { error: updateError } = await supabase
              .from('weekly_summaries')
              .update({
                status: 'PENDING',
                report_data: initialOrchestration,
                title: null,
                why: null,
                body: null,
                open_question: null,
                generated_at: null
              })
              .eq('id', existing.id);

            if (updateError) {
              console.error(`[Queue Trigger] Failed to reset failed weekly summary row ${existing.id}:`, updateError.message);
            } else {
              targetSummaryId = existing.id;
              console.log(`[Queue Trigger] Reset failed weekly summary row ${existing.id} to PENDING for re-triggering. Triggering validation...`);
            }
          }

          if (targetSummaryId) {
            // Trigger validation/generation orchestrator
            if (process.env.BYPASS_REDIS === 'true') {
              try {
                const { weeklyReportOrchestrator } = await import('../weeklyReportOrchestrator');
                setTimeout(async () => {
                  try {
                    console.log(`[Queue Trigger] [BYPASS_REDIS] Running validation/generation for summary ${targetSummaryId}...`);
                    await weeklyReportOrchestrator.validateAndGenerateReport(targetSummaryId, userId, cycleId, w.weekNum);
                  } catch (err: any) {
                    console.error(`[Queue Trigger] Error during validation/generation:`, err.message);
                  }
                }, 1000);
              } catch (importErr: any) {
                console.error(`[Queue Trigger] Failed to import weeklyReportOrchestrator:`, importErr.message);
              }
            } else {
              await queueRegistry.addJob(
                'weekly_summary_generation',
                `weekly_validate_${targetSummaryId}`,
                {
                  summary_id: targetSummaryId,
                  cycle_id: cycleId,
                  user_id: userId,
                  week_number: w.weekNum,
                  is_validation_job: true
                }
              );
            }
          }
        }
      } catch (err: any) {
        console.error(`[Queue Trigger] Error checking weekly summary for Week ${w.weekNum}:`, err.message);
      }
    }
  }

  // 2. Check Monthly assessment (Day 30)
  if (cycleDay >= 30) {
    try {
      const { data: existing } = await supabase
        .from('assessments')
        .select('id')
        .eq('cycle_id', cycleId)
        .maybeSingle();

      if (!existing) {
        const { count } = await supabase
          .from('assessments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        const monthNum = (count || 0) + 1;

        const { data: assessment, error: insertError } = await supabase
          .from('assessments')
          .insert({
            user_id: userId,
            cycle_id: cycleId,
            generation_status: 'pending',
            unlocked_at: new Date().toISOString(),
            ei_avg: 0,
            pr_avg: 0,
            sa_avg: 0,
            dt_score: 0,
            normalised_sa: 0,
            risk_total: 0,
            path_assignment: 'second_cycle',
            branch_assignment: 'A',
            entry_count: 0
          })
          .select()
          .single();

        if (insertError) {
          console.error(`[Queue Trigger] Failed to insert assessments row:`, insertError.message);
        } else if (assessment) {
          console.log(`[Queue Trigger] Created assessments row ${assessment.id}. Enqueueing monthly_report_generation.`);
          await queueRegistry.addJob('monthly_report_generation', `assessment_${assessment.id}`, {
            cycle_id: cycleId,
            user_id: userId,
            assessment_id: assessment.id,
            month_number: monthNum
          });
        }
      }
    } catch (err: any) {
      console.error(`[Queue Trigger] Error checking monthly report:`, err.message);
    }
  }
}

export async function triggerKnowledgeProcessing(
  eventId: string,
  userId: string,
  cycleId: string | null,
  entryId: string | null
) {
  console.log(`[Queue Trigger] Enqueueing knowledge processing job for user ${userId}, event: ${eventId}`);
  try {
    await queueRegistry.addJob('knowledge_processing', `knowledge_event_${eventId}`, {
      event_id: eventId,
      user_id: userId,
      cycle_id: cycleId || undefined,
      entry_id: entryId || undefined
    });
  } catch (err: any) {
    console.error(`[Queue Trigger] Error queueing knowledge processing job:`, err.message);
  }
}
