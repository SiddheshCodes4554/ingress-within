import { supabase } from '../../db';
import { decrypt } from '../../encryption';
import { extractPatternsFromEntry, getHistoricalPatternNames } from '../../patterns/patternExtractor';
import { PatternIntelligenceService } from '../../patterns/patternIntelligenceService';

export interface PatternWorkerJobData {
  entry_id?: string;
  thread_response_id?: string;
  user_id: string;
  cycle_id: string;
  source_type: 'journal' | 'thread' | 'vocab' | 'weekly_report';
  orchestrator_job_id?: string;
}

/**
 * Pattern Processing Worker
 */
export async function processPatternExtraction(jobData: PatternWorkerJobData): Promise<void> {
  const { entry_id, user_id, source_type, orchestrator_job_id } = jobData;

  console.log(`[Pattern Worker] Starting pattern snapshot generation. Source: ${source_type}, Summary/Entry ID: ${entry_id}, User: ${user_id}`);

  if (orchestrator_job_id) {
    try {
      const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
      await IntelligenceOrchestrator.startJob(orchestrator_job_id);
    } catch (err: any) {
      console.warn(`[Pattern Worker] Failed to start orchestrator job ${orchestrator_job_id}:`, err.message);
    }
  }

  if (source_type !== 'weekly_report') {
    console.log(`[Pattern Worker] Bypassing pattern extraction for source: ${source_type}. Only weekly reports trigger snapshots.`);
    if (orchestrator_job_id) {
      try {
        const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
        await IntelligenceOrchestrator.completeJob(orchestrator_job_id, user_id, 'patterns');
      } catch {}
    }
    // Emit PatternCompleted to proceed in the pipeline
    try {
      const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
      await IntelligenceOrchestrator.emitEvent(user_id, 'PatternCompleted', {
        entry_id,
        cycle_id: jobData.cycle_id
      });
    } catch {}
    return;
  }

  if (!entry_id) {
    console.error(`[Pattern Worker] Missing weekly summary ID (entry_id) in jobData.`);
    if (orchestrator_job_id) {
      try {
        const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
        await IntelligenceOrchestrator.failJob(orchestrator_job_id, user_id, 'patterns', 'Missing weekly summary ID');
      } catch {}
    }
    return;
  }

  try {
    await PatternIntelligenceService.generateSnapshotForWeeklyReport(user_id, entry_id);
    console.log(`[Pattern Worker] Successfully generated weekly report snapshot for user ${user_id}, summary ${entry_id}`);

    if (orchestrator_job_id) {
      try {
        const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
        await IntelligenceOrchestrator.completeJob(orchestrator_job_id, user_id, 'patterns', {
          lastProcessedEntry: entry_id
        });
      } catch (err: any) {
        console.error(`[Pattern Worker] Failed to complete orchestrator job:`, err.message);
      }
    }

    // Publish PatternCompleted event
    try {
      const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
      await IntelligenceOrchestrator.emitEvent(user_id, 'PatternCompleted', {
        weekly_summary_id: entry_id,
        cycle_id: jobData.cycle_id
      });
      console.log(`[Pattern Worker] Emitted PatternCompleted event for user ${user_id}`);
    } catch (eventErr: any) {
      console.error(`[Pattern Worker] Error emitting PatternCompleted event:`, eventErr.message);
    }
  } catch (err: any) {
    console.error(`[Pattern Worker] Failed to generate weekly report snapshot:`, err.message);
    if (orchestrator_job_id) {
      try {
        const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
        await IntelligenceOrchestrator.failJob(orchestrator_job_id, user_id, 'patterns', err.message || String(err));
      } catch (errOrch: any) {
        console.error(`[Pattern Worker] Failed to report failure to orchestrator:`, errOrch.message);
      }
    }
  }
}
