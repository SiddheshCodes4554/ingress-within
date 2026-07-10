import { KnowledgeService } from '../../knowledge/knowledgeService';

export interface KnowledgeWorkerJobData {
  event_id: string;
  user_id: string;
  cycle_id?: string;
  entry_id?: string;
}

/**
 * Knowledge background worker.
 * Processes knowledge events asynchronously from the queue.
 */
export async function processKnowledgeExtraction(jobData: KnowledgeWorkerJobData): Promise<void> {
  const { event_id, user_id } = jobData;

  console.log(`[Knowledge Worker] Starting processing for event: ${event_id}, user: ${user_id}`);

  if (!event_id) {
    console.error(`[Knowledge Worker] Missing event_id in jobData.`);
    return;
  }

  try {
    await KnowledgeService.processKnowledgeEvent(event_id);
    console.log(`[Knowledge Worker] Successfully completed processing for event ${event_id}`);
  } catch (err: any) {
    console.error(`[Knowledge Worker] Failed to process event ${event_id}:`, err.message || err);
    throw err;
  }
}
