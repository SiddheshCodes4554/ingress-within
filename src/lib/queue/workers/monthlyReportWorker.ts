import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';

export async function processMonthlyReport(jobData: {
  cycle_id: string;
  user_id: string;
  assessment_id?: string;
  monthly_score_id?: string;
  month_number?: number;
}) {
  const { cycle_id, user_id, assessment_id, monthly_score_id, month_number } = jobData;

  console.log(`[Monthly Report Worker] Processing monthly report for user ${user_id} cycle ${cycle_id}`);

  // 1. Fetch entries for the cycle (joining reflections)
  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('*, reflections(*)')
    .eq('cycle_id', cycle_id)
    .eq('user_id', user_id)
    .order('cycle_day', { ascending: true });

  if (entriesError) {
    throw new Error(`Failed to fetch entries: ${entriesError.message}`);
  }

  const validEntries = (entries || []).filter(e => e.entry_type !== 'empty');
  const entry_count = validEntries.length;

  // 2. Minimum entry validation
  if (entry_count < 20) {
    console.warn(`[Monthly Report Worker] User ${user_id} has only ${entry_count}/20 valid entries. Holding report.`);
    if (assessment_id) {
      await supabase
        .from('assessments')
        .update({
          generation_status: 'held',
          entry_count,
          ei_avg: 0,
          pr_avg: 0,
          sa_avg: 0,
          dt_score: 0,
          normalised_sa: 0,
          risk_total: 0,
          path_assignment: 'second_cycle',
          branch_assignment: 'A'
        })
        .eq('id', assessment_id);
    }
    if (monthly_score_id) {
      await supabase
        .from('monthly_scores')
        .update({
          generation_status: 'held',
          entry_count,
          ei_score: 0,
          pr_score: 0,
          sa_score: 0,
          dt_score: 0,
          primary_dimension: 'PR',
          routing_action: 'no_change'
        })
        .eq('id', monthly_score_id);
    }
    return;
  }

  // 3. Compute Averages
  const ei_avg = parseFloat((validEntries.reduce((sum, e) => sum + Number(e.day_ei || 0), 0) / entry_count).toFixed(2));
  const pr_avg = parseFloat((validEntries.reduce((sum, e) => sum + Number(e.day_pr || 0), 0) / entry_count).toFixed(2));
  const sa_avg = parseFloat((validEntries.reduce((sum, e) => sum + Number(e.day_sa || 0), 0) / entry_count).toFixed(2));

  // 4. Derive Distress Trajectory (DT)
  const sorted = [...validEntries].sort((a, b) => {
    const timeA = new Date(a.written_at || a.created_at).getTime();
    const timeB = new Date(b.written_at || b.created_at).getTime();
    return timeA - timeB;
  });

  const midpoint = Math.floor(sorted.length / 2);
  const early = sorted.slice(0, midpoint);
  const late = sorted.slice(midpoint);

  const early_ei = early.reduce((sum, e) => sum + Number(e.day_ei || 0), 0) / early.length;
  const early_pr = early.reduce((sum, e) => sum + Number(e.day_pr || 0), 0) / early.length;
  const early_sa = early.reduce((sum, e) => sum + Number(e.day_sa || 0), 0) / early.length;

  const late_ei = late.reduce((sum, e) => sum + Number(e.day_ei || 0), 0) / late.length;
  const late_pr = late.reduce((sum, e) => sum + Number(e.day_pr || 0), 0) / late.length;
  const late_sa = late.reduce((sum, e) => sum + Number(e.day_sa || 0), 0) / late.length;

  const ei_traj = early_ei - late_ei;
  const pr_traj = early_pr - late_pr;
  const sa_traj = late_sa - early_sa; // Flipped: positive is improvement

  const raw_dt = (ei_traj + pr_traj + sa_traj) / 3;
  const dt_score = parseFloat((10 - ((raw_dt + 9) / 18 * 9)).toFixed(2));

  // 5. Normalised SA and Risk Total
  const normalised_sa = parseFloat((11 - sa_avg).toFixed(2));
  const risk_total = Math.round(ei_avg + pr_avg + normalised_sa + dt_score);

  // 6. Path Assignment (Stability Gate check first)
  let path_assignment = 'second_cycle';
  let stability_gate_triggered = false;

  if (ei_avg >= 8 && pr_avg >= 7 && sa_avg <= 3 && dt_score >= 7) {
    path_assignment = 'professional_pathway_supported';
    stability_gate_triggered = true;
  } else {
    if (risk_total <= 15) {
      path_assignment = 'maintenance';
    } else if (risk_total <= 29) {
      path_assignment = 'second_cycle';
    } else if (risk_total <= 35) {
      path_assignment = 'professional_pathway_supported';
    } else {
      path_assignment = 'professional_pathway_referred';
    }
  }

  // 7. Branch Assignment
  let branch_assignment = 'A';
  if (ei_avg <= 3 && pr_avg >= 7) {
    branch_assignment = 'C';
  } else if (ei_avg >= 7 && pr_avg <= 6) {
    branch_assignment = 'D';
  } else if (pr_avg >= 7) {
    branch_assignment = 'A';
  } else if (sa_avg <= 3) {
    branch_assignment = 'B';
  } else {
    const normalised_sa_for_branch = 11 - sa_avg;
    const highest = Math.max(ei_avg, pr_avg, normalised_sa_for_branch);
    if (pr_avg === highest) {
      branch_assignment = 'A';
    } else if (ei_avg === highest) {
      branch_assignment = 'D';
    } else if (normalised_sa_for_branch === highest) {
      branch_assignment = 'B';
    } else {
      branch_assignment = 'A';
    }
  }

  // 8. Decrypt entries for AI Report Generation (including completed reflection answers)
  const formattedEntries = validEntries.map(e => {
    const text = decrypt(e.new_entry_text_encrypted, e.new_entry_text_iv) || e.content;
    let content = text || '';

    const rawReflection = e.reflections;
    const reflection = Array.isArray(rawReflection)
      ? (rawReflection[0] || null)
      : (rawReflection || null);

    if (reflection && reflection.status === 'completed' && reflection.reflection_answer) {
      content += `\n[Reflection Question]: ${reflection.closing_question}\n[User Reflection Response]: ${reflection.reflection_answer}`;
    }

    return {
      content: content,
      created_at: e.written_at || e.created_at
    };
  });

  try {
    // 9. Call AI Provider for Report Narrative
    const aiReport = await aiProvider.generateMonthlyReport(formattedEntries);

    // 10. Update assessments Table (Day 30 Report)
    if (assessment_id) {
      const { error: updateAssessmentError } = await supabase
        .from('assessments')
        .update({
          ei_avg,
          pr_avg,
          sa_avg,
          dt_score,
          normalised_sa,
          risk_total,
          path_assignment,
          branch_assignment,
          stability_gate_triggered,
          entry_count,
          generation_status: 'ready',
          report_text: aiReport.insight,
          generated_at: new Date().toISOString()
        })
        .eq('id', assessment_id);

      if (updateAssessmentError) {
        throw new Error(`Failed to update assessments table: ${updateAssessmentError.message}`);
      }
    }

    // 11. Handle subsequent Month-over-Month Delta Routing
    if (monthly_score_id || month_number) {
      const actualMonth = month_number || 2;

      // Fetch prior score baseline (either prior monthly score or Day 30 assessment)
      let prior: any = null;
      const { data: priorMonthlyScores } = await supabase
        .from('monthly_scores')
        .select('*')
        .eq('user_id', user_id)
        .lt('month_number', actualMonth)
        .order('month_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (priorMonthlyScores) {
        prior = {
          ei_score: Number(priorMonthlyScores.ei_score),
          pr_score: Number(priorMonthlyScores.pr_score),
          sa_score: Number(priorMonthlyScores.sa_score),
          dt_score: Number(priorMonthlyScores.dt_score),
          consecutive_worsening_count: priorMonthlyScores.consecutive_worsening_count || 0,
          consecutive_improvement_count: priorMonthlyScores.consecutive_improvement_count || 0,
          routing_action: priorMonthlyScores.routing_action
        };
      } else {
        const { data: assessment } = await supabase
          .from('assessments')
          .select('*')
          .eq('user_id', user_id)
          .maybeSingle();
        
        if (assessment) {
          prior = {
            ei_score: Number(assessment.ei_avg),
            pr_score: Number(assessment.pr_avg),
            sa_score: Number(assessment.sa_avg),
            dt_score: Number(assessment.dt_score),
            consecutive_worsening_count: 0,
            consecutive_improvement_count: 0,
            routing_action: 'no_change'
          };
        }
      }

      // Compute Deltas
      let ei_delta = 0;
      let pr_delta = 0;
      let sa_delta = 0;
      let dt_delta = 0;

      if (prior) {
        ei_delta = ei_avg - prior.ei_score;
        pr_delta = pr_avg - prior.pr_score;
        sa_delta = sa_avg - prior.sa_score; // positive = improving
        dt_delta = dt_score - prior.dt_score;
      }

      // Watch dimension based on user branch
      let primary_dimension: 'EI' | 'PR' | 'SA' | 'both_EI_PR' = 'PR';
      if (branch_assignment === 'A') primary_dimension = 'PR';
      else if (branch_assignment === 'B') primary_dimension = 'SA';
      else if (branch_assignment === 'C') primary_dimension = 'both_EI_PR';
      else if (branch_assignment === 'D') primary_dimension = 'EI';

      // Worsening / Improving evaluation
      let primary_worsening = false;
      let primary_improving = false;

      if (primary_dimension === 'both_EI_PR') {
        primary_worsening = (ei_delta >= 2) || (pr_delta >= 2);
        primary_improving = (ei_delta <= -2) && (pr_delta <= -2);
      } else if (primary_dimension === 'PR') {
        primary_worsening = pr_delta >= 2;
        primary_improving = pr_delta <= -2;
      } else if (primary_dimension === 'EI') {
        primary_worsening = ei_delta >= 2;
        primary_improving = ei_delta <= -2;
      } else if (primary_dimension === 'SA') {
        primary_worsening = sa_delta <= -2;
        primary_improving = sa_delta >= 2;
      }

      // Spike and Recover check (Month number - 2)
      let flag_spike_recovery = false;
      let routing_action = 'no_change';

      const { data: priorPriorRecord } = await supabase
        .from('monthly_scores')
        .select('*')
        .eq('user_id', user_id)
        .eq('month_number', actualMonth - 2)
        .maybeSingle();

      if (prior && prior.routing_action === 'step_back' && priorPriorRecord) {
        let isRecovered = false;
        if (primary_dimension === 'PR') {
          isRecovered = Math.abs(pr_avg - Number(priorPriorRecord.pr_score)) < 2;
        } else if (primary_dimension === 'EI') {
          isRecovered = Math.abs(ei_avg - Number(priorPriorRecord.ei_score)) < 2;
        } else if (primary_dimension === 'SA') {
          isRecovered = Math.abs(sa_avg - Number(priorPriorRecord.sa_score)) < 2;
        } else if (primary_dimension === 'both_EI_PR') {
          isRecovered = Math.abs(pr_avg - Number(priorPriorRecord.pr_score)) < 2 &&
                        Math.abs(ei_avg - Number(priorPriorRecord.ei_score)) < 2;
        }

        if (isRecovered) {
          routing_action = 'no_change';
          flag_spike_recovery = true;
        }
      }

      // Routing decisions (if no spike recovery triggered)
      let consecutive_improvement_count = 0;
      let consecutive_worsening_count = 0;
      let professional_nudge_active = false;

      if (!flag_spike_recovery) {
        if (primary_improving) {
          consecutive_improvement_count = (prior?.consecutive_improvement_count || 0) + 1;
          consecutive_worsening_count = 0;
          routing_action = 'advance';
        } else if (primary_worsening) {
          consecutive_worsening_count = (prior?.consecutive_worsening_count || 0) + 1;
          consecutive_improvement_count = 0;
          if (consecutive_worsening_count >= 2) {
            routing_action = 'professional_nudge';
            professional_nudge_active = true;
          } else {
            routing_action = 'step_back';
          }
        } else {
          consecutive_worsening_count = 0;
          consecutive_improvement_count = 0;
          routing_action = 'no_change';
        }
      }

      const scorePayload = {
        user_id,
        assessment_id: assessment_id || null,
        month_number: actualMonth,
        window_start: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString().split('T')[0], // 28 days back
        window_end: new Date().toISOString().split('T')[0],
        ei_score: ei_avg,
        pr_score: pr_avg,
        sa_score: sa_avg,
        dt_score: dt_score,
        ei_delta,
        pr_delta,
        sa_delta,
        dt_delta,
        primary_dimension,
        routing_action,
        professional_nudge_active,
        consecutive_worsening_count,
        consecutive_improvement_count,
        flag_spike_recovery,
        entry_count,
        generation_status: 'ready',
        report_text: aiReport.insight,
        generated_at: new Date().toISOString()
      };

      if (monthly_score_id) {
        const { error: scoreUpdateError } = await supabase
          .from('monthly_scores')
          .update(scorePayload)
          .eq('id', monthly_score_id);

        if (scoreUpdateError) {
          throw new Error(`Failed to update monthly_scores row: ${scoreUpdateError.message}`);
        }
      } else {
        // Upsert based on unique constraint (user_id, month_number)
        const { error: scoreInsertError } = await supabase
          .from('monthly_scores')
          .upsert(scorePayload, { onConflict: 'user_id,month_number' });

        if (scoreInsertError) {
          throw new Error(`Failed to insert monthly_scores row: ${scoreInsertError.message}`);
        }
      }
    }

    console.log(`[Monthly Report Worker] Successfully processed monthly report for user ${user_id}`);
  } catch (err: any) {
    console.error(`[Monthly Report Worker] Error generating monthly report:`, err);
    if (assessment_id) {
      await supabase.from('assessments').update({ generation_status: 'failed' }).eq('id', assessment_id);
    }
    if (monthly_score_id) {
      await supabase.from('monthly_scores').update({ generation_status: 'failed' }).eq('id', monthly_score_id);
    }
    throw err;
  }
}
