import { KnowledgeService } from '../../knowledge/knowledgeService';

export interface KnowledgeWorkerJobData {
  event_id: string;
  user_id: string;
  cycle_id?: string;
  entry_id?: string;
  orchestrator_job_id?: string;
}

/**
 * Knowledge background worker.
 * Processes knowledge events asynchronously from the queue.
 */
export async function processKnowledgeExtraction(jobData: KnowledgeWorkerJobData): Promise<void> {
  const { event_id, user_id, entry_id, orchestrator_job_id } = jobData;

  console.log(`[Knowledge Worker] Starting processing for event: ${event_id}, user: ${user_id}`);

  if (!event_id) {
    console.error(`[Knowledge Worker] Missing event_id in jobData.`);
    if (orchestrator_job_id) {
      try {
        const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
        await IntelligenceOrchestrator.failJob(orchestrator_job_id, user_id, 'knowledge', 'Missing event_id');
      } catch {}
    }
    return;
  }

  if (orchestrator_job_id) {
    try {
      const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
      await IntelligenceOrchestrator.startJob(orchestrator_job_id);
    } catch (err: any) {
      console.warn(`[Knowledge Worker] Failed to start orchestrator job ${orchestrator_job_id}:`, err.message);
    }
  }

  try {
    await KnowledgeService.processKnowledgeEvent(event_id);
    console.log(`[Knowledge Worker] Successfully completed processing for event ${event_id}`);

    if (orchestrator_job_id) {
      try {
        const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
        await IntelligenceOrchestrator.completeJob(orchestrator_job_id, user_id, 'knowledge', {
          lastProcessedEntry: entry_id
        });
      } catch (err: any) {
        console.error(`[Knowledge Worker] Failed to complete orchestrator job:`, err.message);
      }
    }

    // Publish KnowledgeCompleted event
    try {
      const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
      await IntelligenceOrchestrator.emitEvent(user_id, 'KnowledgeCompleted', {
        event_id,
        cycle_id: jobData.cycle_id
      });
      console.log(`[Knowledge Worker] Emitted KnowledgeCompleted event for user ${user_id}`);
    } catch (eventErr: any) {
      console.error(`[Knowledge Worker] Error emitting KnowledgeCompleted event:`, eventErr.message);
    }
  } catch (err: any) {
    console.error(`[Knowledge Worker] Failed to process event ${event_id}:`, err.message || err);
    if (orchestrator_job_id) {
      try {
        const { IntelligenceOrchestrator } = await import('../../orchestrator/intelligenceOrchestrator');
        await IntelligenceOrchestrator.failJob(orchestrator_job_id, user_id, 'knowledge', err.message || String(err));
      } catch (errOrch: any) {
        console.error(`[Knowledge Worker] Failed to report failure to orchestrator:`, errOrch.message);
      }
    }
    throw err;
  }
}
