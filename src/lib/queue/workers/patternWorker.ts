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
}

/**
 * Pattern Processing Worker
 *
 * Triggered by:
 *   - New journal entry (after vocab processing completes)
 *   - Thread response completed
 *   - Weekly report completed
 *   - Vocabulary update completed
 *
 * This worker:
 *   1. Fetches the source text (entry, thread, etc.)
 *   2. Gets historical pattern names for context
 *   3. Calls the pattern extractor (AI — only happens here, never on page load)
 *   4. Pattern extractions are persisted by the extractor itself
 *   5. Calls PatternIntelligenceService.updateActiveCycleSnapshot() to rebuild the snapshot
 *
 * NEVER modifies completed cycle snapshots.
 * NEVER runs on page load.
 * NEVER called from API GET routes.
 */
export async function processPatternExtraction(jobData: PatternWorkerJobData): Promise<void> {
  const { entry_id, user_id, source_type } = jobData;

  console.log(`[Pattern Worker] Starting pattern snapshot generation. Source: ${source_type}, Summary ID: ${entry_id}, User: ${user_id}`);

  if (source_type !== 'weekly_report') {
    console.log(`[Pattern Worker] Bypassing pattern extraction for source: ${source_type}. Only weekly reports trigger snapshots.`);
    return;
  }

  if (!entry_id) {
    console.error(`[Pattern Worker] Missing weekly summary ID (entry_id) in jobData.`);
    return;
  }

  try {
    await PatternIntelligenceService.generateSnapshotForWeeklyReport(user_id, entry_id);
    console.log(`[Pattern Worker] Successfully generated weekly report snapshot for user ${user_id}, summary ${entry_id}`);
  } catch (err: any) {
    console.error(`[Pattern Worker] Failed to generate weekly report snapshot:`, err.message);
  }
}
