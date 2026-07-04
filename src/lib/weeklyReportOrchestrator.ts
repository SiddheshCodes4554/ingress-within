import { supabase } from './db';
import { queueRegistry } from './queue/registry';

export interface OrchestrationEvent {
  user_id: string;
  entry_id: string;
  cycle_id: string;
  week_number: number;
  job_name: 'SCORING_COMPLETED' | 'REFLECTION_COMPLETED' | 'CRISIS_COMPLETED' | 'VOCABULARY_COMPLETED' | 'THREADS_COMPLETED' | 'CYCLE_METADATA_UPDATED';
  completed_at: string;
  status: 'success' | 'failed' | 'skipped' | 'suppressed';
}

class WeeklyReportOrchestrator {
  /**
   * Listen for worker completion events and track state in database.
   */
  public async emitEvent(event: OrchestrationEvent) {
    const { user_id, entry_id, cycle_id, week_number, job_name, completed_at, status } = event;

    console.log(`[WeeklyReportOrchestrator] Event received: ${job_name} (${status}) for user ${user_id}, entry ${entry_id}, week ${week_number}`);

    // 1. Fetch the weekly summary row
    const { data: summary, error: fetchErr } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('cycle_id', cycle_id)
      .eq('week_number', week_number)
      .maybeSingle();

    if (fetchErr) {
      console.error(`[WeeklyReportOrchestrator] Error fetching weekly summary:`, fetchErr.message);
      return;
    }

    if (!summary) {
      console.warn(`[WeeklyReportOrchestrator] No weekly summary row found for cycle ${cycle_id} week ${week_number}. Cannot track event.`);
      return;
    }

    // READY is a terminal state. Abort any processing if already generated successfully.
    if (summary.status === 'READY') {
      console.log(`[WeeklyReportOrchestrator] Report already in terminal READY status. Bypassing event.`);
      return;
    }

    // 2. Parse or initialize orchestration state inside report_data JSONB
    let reportData: any = summary.report_data;
    if (!reportData || typeof reportData !== 'object' || !reportData.orchestration) {
      reportData = {
        ...(typeof reportData === 'object' ? reportData : {}),
        orchestration: {
          status: 'WAITING_FOR_PROCESSING',
          entry_id,
          completed_events: {
            'SCORING_COMPLETED': false,
            'REFLECTION_COMPLETED': false,
            'CRISIS_COMPLETED': false,
            'VOCABULARY_COMPLETED': false,
            'THREADS_COMPLETED': false,
            'CYCLE_METADATA_UPDATED': false
          },
          history: []
        }
      };
    }

    // Update event completion state
    const isCompleted = status === 'success' || status === 'skipped' || status === 'suppressed';
    reportData.orchestration.completed_events[job_name] = isCompleted;
    reportData.orchestration.history.push({
      event: job_name,
      status,
      completed_at,
      timestamp: new Date().toISOString()
    });

    // 3. Determine next orchestration status based on completed events
    const completedEvents = reportData.orchestration.completed_events;
    
    // Extensible event checker
    const requiredEvents = [
      'SCORING_COMPLETED',
      'REFLECTION_COMPLETED',
      'CRISIS_COMPLETED',
      'VOCABULARY_COMPLETED',
      'THREADS_COMPLETED',
      'CYCLE_METADATA_UPDATED'
    ];

    const missingEvents = requiredEvents.filter(ev => !completedEvents[ev]);
    let nextStatus: 'WAITING_FOR_PROCESSING' | 'GRACE_PERIOD' = 'WAITING_FOR_PROCESSING';

    if (missingEvents.length === 0) {
      nextStatus = 'GRACE_PERIOD';
    }

    reportData.orchestration.status = nextStatus;
    reportData.orchestration.updated_at = new Date().toISOString();

    console.log(`[WeeklyReportOrchestrator] Summary ${summary.id} transitioning to status: ${nextStatus}. Missing events:`, missingEvents);

    // Save updated status and orchestration data to database
    await supabase
      .from('weekly_summaries')
      .update({
        status: nextStatus,
        report_data: reportData
      })
      .eq('id', summary.id);

    // 4. Trigger grace timer if we transitioned to GRACE_PERIOD
    if (nextStatus === 'GRACE_PERIOD' && summary.status !== 'GRACE_PERIOD') {
      await this.startGraceTimer(summary.id, user_id, cycle_id, week_number);
    }
  }

  /**
   * Starts the grace period timer before performing final audits and generation.
   */
  private async startGraceTimer(summaryId: string, userId: string, cycleId: string, weekNumber: number) {
    // Audit check: Check if report was already generated
    const { data: summary } = await supabase
      .from('weekly_summaries')
      .select('status')
      .eq('id', summaryId)
      .single();

    if (summary && summary.status === 'READY') {
      console.log(`[WeeklyReportOrchestrator] Summary ${summaryId} is already READY. Skipping grace timer.`);
      return;
    }

    const gracePeriodMs = process.env.WEEKLY_REPORT_GRACE_PERIOD_MS 
      ? parseInt(process.env.WEEKLY_REPORT_GRACE_PERIOD_MS) 
      : 5 * 60 * 1000; // Default 5 minutes

    console.log(`[WeeklyReportOrchestrator] Starting grace timer of ${gracePeriodMs}ms for weekly summary ${summaryId}`);

    if (process.env.BYPASS_REDIS === 'true') {
      // In development mode (Redis bypassed), run the timer inline using setTimeout
      setTimeout(async () => {
        try {
          console.log(`[WeeklyReportOrchestrator] [BYPASS_REDIS] Grace period expired for summary ${summaryId}. Running validation...`);
          await this.validateAndGenerateReport(summaryId, userId, cycleId, weekNumber);
        } catch (err: any) {
          console.error(`[WeeklyReportOrchestrator] Error during inline validation/generation:`, err.message);
        }
      }, gracePeriodMs);
    } else {
      // In production mode, schedule a delayed BullMQ job to run when the grace timer expires
      // Assign deterministic jobId to avoid duplicate processing jobs
      await queueRegistry.addJob(
        'weekly_summary_generation',
        `weekly_validate_${summaryId}`,
        {
          summary_id: summaryId,
          cycle_id: cycleId,
          user_id: userId,
          week_number: weekNumber,
          is_validation_job: true
        },
        `weekly_validate_${summaryId}`, // jobId
        { delay: gracePeriodMs } // BullMQ delayed options
      );
    }
  }

  /**
   * Final validation audit to verify data completeness prior to Weekly Report generation.
   */
  public async validateAndGenerateReport(summaryId: string, userId: string, cycleId: string, weekNumber: number) {
    console.log(`[WeeklyReportOrchestrator] Final validation check for weekly summary ${summaryId}...`);

    // Fetch summary
    const { data: summary } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('id', summaryId)
      .single();

    if (!summary) {
      console.error(`[WeeklyReportOrchestrator] Summary ${summaryId} not found for validation.`);
      return;
    }

    // 1. Immutability & Duplicate check (Strict state guard)
    if (summary.status === 'READY') {
      console.log(`[WeeklyReportOrchestrator] Report ${summaryId} already exists (status READY). Cancelling duplicate generation.`);
      return;
    }

    // Fetch the final entry of the week (highest cycle_day within the week's range)
    const maxDay = weekNumber * 7;
    const minDay = (weekNumber - 1) * 7 + 1;
    const { data: entry } = await supabase
      .from('entries')
      .select('*')
      .eq('cycle_id', cycleId)
      .gte('cycle_day', minDay)
      .lte('cycle_day', maxDay)
      .order('cycle_day', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!entry) {
      console.error(`[WeeklyReportOrchestrator] Final entry for week range [${minDay}, ${maxDay}] not found. Rescheduling validation...`);
      await this.rescheduleValidation(summaryId, userId, cycleId, weekNumber);
      return;
    }

    // Fetch reflection
    const { data: reflection } = await supabase
      .from('reflections')
      .select('*')
      .eq('entry_id', entry.id)
      .maybeSingle();

    // 2. Perform Final Audit
    const isScoringComplete = entry.scoring_status === 'scored';
    const isReflectionComplete = !!reflection || entry.crisis_flag || entry.reflection_suppressed;
    const isCrisisComplete = entry.crisis_checked === true;
    const isVocabComplete = entry.vocab_processed === true;

    // Fetch cycle metadata to confirm it's finalized
    const { data: cycle } = await supabase
      .from('cycles')
      .select('*')
      .eq('id', cycleId)
      .single();
    const isCycleMetadataFinalized = cycle && (
      cycle.status?.toLowerCase() === 'archived' ||
      cycle.status?.toLowerCase() === 'completed' ||
      cycle.status?.toLowerCase() === 'complete' ||
      (cycle.current_day || 1) >= maxDay
    );

    const validationPassed = isScoringComplete && isReflectionComplete && isCrisisComplete && isVocabComplete && isCycleMetadataFinalized;

    if (!validationPassed) {
      console.warn(`[WeeklyReportOrchestrator] Final validation failed for summary ${summaryId}. Rescheduling validation...`, {
        isScoringComplete,
        isReflectionComplete,
        isCrisisComplete,
        isVocabComplete,
        isCycleMetadataFinalized
      });
      await this.rescheduleValidation(summaryId, userId, cycleId, weekNumber);
      return;
    }

    console.log(`[WeeklyReportOrchestrator] Final validation PASSED for summary ${summaryId}. Proceeding to report generation.`);

    // 3. Update status to GENERATING in DB
    if (summary.report_data && summary.report_data.orchestration) {
      summary.report_data.orchestration.status = 'GENERATING';
    }
    await supabase
      .from('weekly_summaries')
      .update({
        status: 'GENERATING',
        report_data: summary.report_data
      })
      .eq('id', summaryId);

    // 4. Generate weekly report
    try {
      const startTime = Date.now();
      const { processWeeklySummary } = await import('./queue/workers/weeklySummaryWorker');
      
      // Call the worker to generate the report
      await processWeeklySummary({
        cycle_id: cycleId,
        user_id: userId,
        week_number: weekNumber,
        summary_id: summaryId
      });

      const duration = Date.now() - startTime;
      console.log(`[WeeklyReportOrchestrator] Weekly report generation completed successfully in ${duration}ms.`);
    } catch (err: any) {
      console.error(`[WeeklyReportOrchestrator] Report generation failed:`, err.message || err);
      
      // Update status to FAILED
      if (summary.report_data && summary.report_data.orchestration) {
        summary.report_data.orchestration.status = 'FAILED';
      }
      await supabase
        .from('weekly_summaries')
        .update({
          status: 'FAILED',
          report_data: summary.report_data
        })
        .eq('id', summaryId);

      throw err;
    }
  }

  /**
   * Reschedules validation audit after a short delay if check fails.
   */
  private async rescheduleValidation(summaryId: string, userId: string, cycleId: string, weekNumber: number) {
    const retryDelayMs = 60 * 1000; // Reschedule after 1 minute
    console.log(`[WeeklyReportOrchestrator] Rescheduling validation for summary ${summaryId} in ${retryDelayMs}ms`);

    // Fetch the summary row to get report_data
    const { data: summary } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('id', summaryId)
      .single();

    if (summary) {
      // Abort if already completed
      if (summary.status === 'READY') return;

      const reportData = summary.report_data || {};
      if (reportData.orchestration) {
        reportData.orchestration.status = 'WAITING_FOR_PROCESSING';
      }
      await supabase
        .from('weekly_summaries')
        .update({
          status: 'WAITING_FOR_PROCESSING',
          report_data: reportData
        })
        .eq('id', summaryId);
    }

    if (process.env.BYPASS_REDIS === 'true') {
      setTimeout(async () => {
        try {
          await this.validateAndGenerateReport(summaryId, userId, cycleId, weekNumber);
        } catch (err: any) {
          console.error(`[WeeklyReportOrchestrator] Error during rescheduled validation:`, err.message);
        }
      }, retryDelayMs);
    } else {
      // Use deterministic jobId to overwrite/ignore duplicate reschedule events
      await queueRegistry.addJob(
        'weekly_summary_generation',
        `weekly_validate_${summaryId}`,
        {
          summary_id: summaryId,
          cycle_id: cycleId,
          user_id: userId,
          week_number: weekNumber,
          is_validation_job: true
        },
        `weekly_validate_${summaryId}`, // jobId
        { delay: retryDelayMs }
      );
    }
  }
}

export const weeklyReportOrchestrator = new WeeklyReportOrchestrator();
