import { supabase } from '../db';
import { queueRegistry } from './registry';

export async function triggerAIProcessing(entryId: string, userId: string) {
  console.log(`[Queue Trigger] Enqueueing background jobs for entry ${entryId}`);
  try {
    await queueRegistry.addJob('entry_scoring', `score_${entryId}`, {
      entry_id: entryId,
      user_id: userId
    });
  } catch (err: any) {
    console.error(`[Queue Trigger] Error queueing AI processing jobs for entry ${entryId}:`, err.message);
  }
}

export async function checkWeeklyAndMonthlySummary(userId: string, cycleId: string | null, cycleDay: number) {
  if (!cycleId) return;

  console.log(`[Queue Trigger] Checking cycle day milestones for user ${userId}, day ${cycleDay}`);

  // 1. Check Weekly Summary (Day 7, 14, 21)
  const targetDays = [7, 14, 21];
  if (targetDays.includes(cycleDay)) {
    const weekNum = cycleDay / 7;
    try {
      const { data: existing } = await supabase
        .from('weekly_summaries')
        .select('id, status')
        .eq('cycle_id', cycleId)
        .eq('week_number', weekNum)
        .maybeSingle();

      if (!existing || existing.status === 'failed') {
        // Query the final entry ID to associate with orchestration state
        const { data: entry } = await supabase
          .from('entries')
          .select('id')
          .eq('cycle_id', cycleId)
          .eq('cycle_day', cycleDay)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const entryId = entry?.id || '';

        const initialOrchestration = {
          orchestration: {
            status: 'waiting_for_scoring',
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
              { stage: 'waiting_for_scoring', timestamp: new Date().toISOString() }
            ],
            updated_at: new Date().toISOString()
          }
        };

        if (!existing) {
          const { data: summary, error: insertError } = await supabase
            .from('weekly_summaries')
            .insert({
              user_id: userId,
              cycle_id: cycleId,
              week_number: weekNum,
              day_start: cycleDay - 6,
              day_end: cycleDay,
              status: 'pending',
              report_data: initialOrchestration
            })
            .select()
            .single();

          if (insertError) {
            console.error(`[Queue Trigger] Failed to insert weekly_summaries row:`, insertError.message);
          } else if (summary) {
            console.log(`[Queue Trigger] Created weekly summary row ${summary.id} in status pending (waiting_for_scoring). Waiting for intelligence engines...`);
          }
        } else {
          // Reset existing failed summary to pending to allow re-triggering
          const { error: updateError } = await supabase
            .from('weekly_summaries')
            .update({
              status: 'pending',
              report_data: initialOrchestration,
              title: null,
              why: null,
              body: null,
              open_question: null,
              generated_at: null
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error(`[Queue Trigger] Failed to reset failed weekly summary row:`, updateError.message);
          } else {
            console.log(`[Queue Trigger] Reset failed weekly summary row ${existing.id} to pending for re-triggering.`);
          }
        }
      }
    } catch (err: any) {
      console.error(`[Queue Trigger] Error checking weekly summary:`, err.message);
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
