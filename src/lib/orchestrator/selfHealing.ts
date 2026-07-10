import { supabase } from '../db';
import { IntelligenceOrchestrator } from './intelligenceOrchestrator';

export class SelfHealingService {
  /**
   * Run the complete Integrity Audit and Self-Healing routine for a user.
   */
  public static async runIntegrityAudit(userId: string): Promise<void> {
    console.log(`[Self-Healing] Starting Integrity Audit for user ${userId}...`);
    const auditLogs: string[] = [];

    // Run audits sequentially
    await this.healMissingWeeklyReports(userId, auditLogs);
    await this.healMissingVocabularySnapshots(userId, auditLogs);
    await this.healMissingPatternSnapshots(userId, auditLogs);
    await this.healMissingKnowledgeCards(userId, auditLogs);
    await this.healBrokenReferences(userId, auditLogs);
    await this.healDuplicateJobs(userId, auditLogs);
    await this.healIncompleteBackfills(userId, auditLogs);

    if (auditLogs.length > 0) {
      console.log(`[Self-Healing] Audit completed. Repaired ${auditLogs.length} issues:`, auditLogs);
      // Write a summary event log to orchestrator_events
      await supabase.from('orchestrator_events').insert({
        user_id: userId,
        event_type: 'SelfHealingAuditCompleted',
        payload: {
          repairs: auditLogs,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      console.log(`[Self-Healing] Integrity Audit passed. No issues found for user ${userId}.`);
    }
  }

  /**
   * 1. Audit and heal missing weekly summaries/reports.
   */
  private static async healMissingWeeklyReports(userId: string, auditLogs: string[]): Promise<void> {
    const { queueRegistry } = await import('../queue/registry');

    try {
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!activeCycle) return;

      const { data: maxEntry } = await supabase
        .from('entries')
        .select('cycle_day')
        .eq('user_id', userId)
        .eq('cycle_id', activeCycle.id)
        .order('cycle_day', { ascending: false })
        .limit(1)
        .maybeSingle();

      const cycleDay = maxEntry?.cycle_day || 0;
      const weeksToCheck = [
        { weekNum: 1, triggerDay: 8, startDay: 1, endDay: 7 },
        { weekNum: 2, triggerDay: 15, startDay: 8, endDay: 14 },
        { weekNum: 3, triggerDay: 22, startDay: 15, endDay: 21 }
      ];

      for (const w of weeksToCheck) {
        if (cycleDay >= w.triggerDay) {
          const { data: existing } = await supabase
            .from('weekly_summaries')
            .select('id')
            .eq('cycle_id', activeCycle.id)
            .eq('week_number', w.weekNum)
            .maybeSingle();

          if (!existing) {
            console.log(`[Self-Healing] Found missing Weekly Summary for cycle ${activeCycle.id} week ${w.weekNum}. Repairing...`);
            const { data: insertedSummary } = await supabase
              .from('weekly_summaries')
              .insert({
                user_id: userId,
                cycle_id: activeCycle.id,
                week_number: w.weekNum,
                day_start: w.startDay,
                day_end: w.endDay,
                status: 'PENDING'
              })
              .select('id')
              .single();

            if (insertedSummary) {
              const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'weekly_report', `SelfHealing:WeeklyReportRepair:${w.weekNum}`);
              await queueRegistry.addJob('weekly_summary_generation', `weekly_validate_${insertedSummary.id}`, {
                summary_id: insertedSummary.id,
                cycle_id: activeCycle.id,
                user_id: userId,
                week_number: w.weekNum,
                is_validation_job: true,
                orchestrator_job_id: jobId
              });

              auditLogs.push(`Repaired missing weekly report: summaryId=${insertedSummary.id}, weekNum=${w.weekNum}`);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[Self-Healing] Error auditing weekly reports:', err.message);
    }
  }

  /**
   * 2. Audit and heal missing vocabulary snapshots.
   */
  private static async healMissingVocabularySnapshots(userId: string, auditLogs: string[]): Promise<void> {
    const { queueRegistry } = await import('../queue/registry');

    try {
      const { data: summaries } = await supabase
        .from('weekly_summaries')
        .select('id, cycle_id, week_number')
        .eq('user_id', userId)
        .eq('status', 'READY');

      if (!summaries) return;

      for (const summary of summaries) {
        const { data: existingVocab } = await supabase
          .from('vocab_snapshots')
          .select('id')
          .eq('user_id', userId)
          .eq('cycle_id', summary.cycle_id)
          .eq('cycle_number', summary.week_number)
          .maybeSingle();

        if (!existingVocab) {
          console.log(`[Self-Healing] Vocabulary snapshot missing for week ${summary.week_number}. Repairing...`);
          const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'vocabulary', `SelfHealing:VocabRepair:${summary.week_number}`);
          await queueRegistry.addJob('vocab_processing', `vocab_repair_${summary.week_number}_${Date.now()}`, {
            user_id: userId,
            cycle_id: summary.cycle_id,
            bypass_ai: true,
            orchestrator_job_id: jobId
          });

          auditLogs.push(`Repaired missing vocabulary snapshot: week=${summary.week_number}`);
        }
      }
    } catch (err: any) {
      console.error('[Self-Healing] Error auditing vocabulary snapshots:', err.message);
    }
  }

  /**
   * 3. Audit and heal missing pattern snapshots.
   */
  private static async healMissingPatternSnapshots(userId: string, auditLogs: string[]): Promise<void> {
    const { queueRegistry } = await import('../queue/registry');

    try {
      const { data: summaries } = await supabase
        .from('weekly_summaries')
        .select('id, cycle_id')
        .eq('user_id', userId)
        .eq('status', 'READY');

      if (!summaries) return;

      for (const summary of summaries) {
        const { data: existingPattern } = await supabase
          .from('pattern_snapshots')
          .select('id')
          .eq('user_id', userId)
          .eq('cycle_id', summary.id)
          .maybeSingle();

        if (!existingPattern) {
          console.log(`[Self-Healing] Pattern snapshot missing for weekly summary ${summary.id}. Repairing...`);
          const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'patterns', `SelfHealing:PatternRepair:${summary.id}`);
          await queueRegistry.addJob('pattern_processing', `pattern_weekly_repair_${summary.id}`, {
            entry_id: summary.id,
            user_id: userId,
            cycle_id: summary.cycle_id,
            source_type: 'weekly_report',
            orchestrator_job_id: jobId
          });

          auditLogs.push(`Repaired missing pattern snapshot: summaryId=${summary.id}`);
        }
      }
    } catch (err: any) {
      console.error('[Self-Healing] Error auditing pattern snapshots:', err.message);
    }
  }

  /**
   * 4. Audit and heal missing Knowledge cards.
   */
  private static async healMissingKnowledgeCards(userId: string, auditLogs: string[]): Promise<void> {
    const { queueRegistry } = await import('../queue/registry');

    try {
      // Check if knowledge cards are completely empty for this user
      const { count } = await supabase
        .from('knowledge_cards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if ((count || 0) === 0) {
        // Find latest completed summary or entry to kickstart sync
        const { data: latestEntry } = await supabase
          .from('entries')
          .select('id, cycle_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestEntry) {
          console.log(`[Self-Healing] Knowledge Cards are missing for user ${userId}. Repairing...`);
          const jobId = await IntelligenceOrchestrator.enqueueJob(userId, 'knowledge', 'SelfHealing:KnowledgeCardRepair');
          await queueRegistry.addJob('knowledge_processing', `knowledge_repair_${Date.now()}`, {
            event_id: latestEntry.id,
            user_id: userId,
            cycle_id: latestEntry.cycle_id,
            orchestrator_job_id: jobId
          });

          auditLogs.push(`Healed missing Knowledge Cards: triggered sync for user ${userId}`);
        }
      }
    } catch (err: any) {
      console.error('[Self-Healing] Error auditing knowledge cards:', err.message);
    }
  }

  /**
   * 5. Audit and prune broken references.
   */
  private static async healBrokenReferences(userId: string, auditLogs: string[]): Promise<void> {
    try {
      // Audit queued or running jobs pointing to missing entries in trigger payload
      const { data: activeJobs } = await supabase
        .from('orchestrator_jobs')
        .select('id, trigger, engine')
        .eq('user_id', userId)
        .in('status', ['queued', 'running']);

      if (activeJobs) {
        for (const job of activeJobs) {
          const parts = job.trigger.split(':');
          const resourceId = parts[1] || '';

          // If the resourceId looks like a UUID, check if it refers to a missing entry
          if (resourceId.length === 36 && (job.engine === 'reflection' || job.engine === 'crisis_detection' || job.engine === 'vocabulary')) {
            const { data: entry } = await supabase
              .from('entries')
              .select('id')
              .eq('id', resourceId)
              .maybeSingle();

            if (!entry) {
              console.log(`[Self-Healing] Job ${job.id} points to missing entry ${resourceId}. Pruning...`);
              await supabase
                .from('orchestrator_jobs')
                .update({
                  status: 'failed',
                  last_error: 'Self-Healing: Reference entry no longer exists.'
                })
                .eq('id', job.id);

              auditLogs.push(`Pruned broken reference job: jobId=${job.id}, engine=${job.engine}`);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[Self-Healing] Error auditing broken references:', err.message);
    }
  }

  /**
   * 6. Audit and prune duplicate jobs.
   */
  private static async healDuplicateJobs(userId: string, auditLogs: string[]): Promise<void> {
    try {
      // Find active jobs grouping by engine and trigger to find duplicates
      const { data: jobs } = await supabase
        .from('orchestrator_jobs')
        .select('id, engine, trigger, queued_at')
        .eq('user_id', userId)
        .in('status', ['queued', 'running'])
        .order('queued_at', { ascending: false });

      if (jobs) {
        const uniqueKeys = new Set<string>();
        for (const job of jobs) {
          const key = `${job.engine}:${job.trigger}`;
          if (uniqueKeys.has(key)) {
            // Found a duplicate active job! Since we ordered by queued_at DESC, the older ones are duplicates
            console.log(`[Self-Healing] Found duplicate job ${job.id} for key ${key}. Cancelling...`);
            await supabase
              .from('orchestrator_jobs')
              .update({
                status: 'failed',
                last_error: 'Self-Healing: Cancelled duplicate active job.'
              })
              .eq('id', job.id);

            auditLogs.push(`Pruned duplicate job: jobId=${job.id}, key=${key}`);
          } else {
            uniqueKeys.add(key);
          }
        }
      }
    } catch (err: any) {
      console.error('[Self-Healing] Error auditing duplicate jobs:', err.message);
    }
  }

  /**
   * 7. Audit and fail stalled or incomplete backfills/jobs.
   */
  private static async healIncompleteBackfills(userId: string, auditLogs: string[]): Promise<void> {
    try {
      // Prune any jobs that are stuck in 'queued' or 'running' status for more than 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: stalledJobs } = await supabase
        .from('orchestrator_jobs')
        .select('id, engine, status, queued_at')
        .eq('user_id', userId)
        .in('status', ['queued', 'running'])
        .lt('queued_at', oneDayAgo);

      if (stalledJobs) {
        for (const job of stalledJobs) {
          console.log(`[Self-Healing] Stalled job detected: ID ${job.id}, engine: ${job.engine}, status: ${job.status}. Pruning...`);
          await supabase
            .from('orchestrator_jobs')
            .update({
              status: 'failed',
              last_error: 'Self-Healing: Stalled job pruned after 24 hours.'
            })
            .eq('id', job.id);

          auditLogs.push(`Pruned stalled job: jobId=${job.id}, engine=${job.engine}`);
        }
      }
    } catch (err: any) {
      console.error('[Self-Healing] Error auditing stalled backfills:', err.message);
    }
  }
}
