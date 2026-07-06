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
  const { entry_id, thread_response_id, user_id, cycle_id, source_type } = jobData;

  console.log(`[Pattern Worker] Starting pattern extraction. Source: ${source_type}, Entry: ${entry_id || thread_response_id}, User: ${user_id}`);

  // 1. Verify this cycle is still active — never process completed cycles
  const { data: snapshot } = await supabase
    .from('pattern_snapshots')
    .select('id, snapshot_status')
    .eq('user_id', user_id)
    .eq('cycle_id', cycle_id)
    .maybeSingle();

  if (snapshot?.snapshot_status === 'completed') {
    console.log(`[Pattern Worker] Cycle ${cycle_id} snapshot is completed. Skipping extraction.`);
    return;
  }

  // 2. Fetch source text
  let entryText = '';
  let effectiveEntryId = entry_id || '';

  if (source_type === 'journal' && entry_id) {
    const { data: entry, error } = await supabase
      .from('entries')
      .select('id, content, content_iv, cycle_id, user_id')
      .eq('id', entry_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (error || !entry) {
      console.error(`[Pattern Worker] Could not fetch entry ${entry_id}:`, error?.message);
      return;
    }

    // Decrypt if encrypted
    if (entry.content_iv && entry.content) {
      try {
        entryText = (await decrypt(entry.content, entry.content_iv)) || entry.content;
      } catch {
        entryText = entry.content; // fallback to raw if decryption fails
      }
    } else {
      entryText = entry.content || '';
    }

  } else if (source_type === 'thread' && thread_response_id) {
    const { data: resp, error } = await supabase
      .from('thread_responses')
      .select('id, response_text, user_id')
      .eq('id', thread_response_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (error || !resp) {
      console.error(`[Pattern Worker] Could not fetch thread response ${thread_response_id}:`, error?.message);
      return;
    }

    entryText = resp.response_text || '';
    effectiveEntryId = thread_response_id;

  } else if (source_type === 'weekly_report') {
    // For weekly reports, extract patterns from the report body text
    const { data: summary, error } = await supabase
      .from('weekly_summaries')
      .select('id, body, user_id, cycle_id')
      .eq('cycle_id', cycle_id)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !summary) {
      console.error(`[Pattern Worker] Could not fetch weekly summary for cycle ${cycle_id}:`, error?.message);
      return;
    }

    entryText = summary.body || '';
    effectiveEntryId = summary.id;

  } else if (source_type === 'vocab') {
    // For vocab triggers, we re-use the latest entry text
    if (!entry_id) {
      console.warn(`[Pattern Worker] Vocab trigger without entry_id — skipping.`);
      return;
    }

    const { data: entry } = await supabase
      .from('entries')
      .select('content, content_iv')
      .eq('id', entry_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (!entry) {
      console.warn(`[Pattern Worker] Vocab trigger: entry ${entry_id} not found.`);
      return;
    }

    if (entry.content_iv && entry.content) {
      try {
        entryText = (await decrypt(entry.content, entry.content_iv)) || entry.content;
      } catch {
        entryText = entry.content;
      }
    } else {
      entryText = entry.content || '';
    }
  }

  if (!entryText || entryText.trim().length < 20) {
    console.warn(`[Pattern Worker] Text too short to extract patterns (${entryText.length} chars). Skipping.`);
    return;
  }

  // 3. Get historical patterns for AI context continuity
  const historicalPatterns = await getHistoricalPatternNames(user_id);

  // 4. Run extraction (AI call — happens only here, never on page load)
  const extractionResult = await extractPatternsFromEntry({
    entryText,
    userId: user_id,
    cycleId: cycle_id,
    entryId: effectiveEntryId,
    sourceType: source_type,
    historicalPatterns,
  });

  console.log(`[Pattern Worker] Extraction complete. ${extractionResult.candidates.length} publishable patterns found.`);

  // 5. Update the active cycle snapshot
  // Pattern extractions were already persisted by extractPatternsFromEntry()
  // Now rebuild the snapshot from all extractions for this cycle
  try {
    await PatternIntelligenceService.updateActiveCycleSnapshot(user_id, cycle_id);
    console.log(`[Pattern Worker] Active cycle snapshot updated for user ${user_id}, cycle ${cycle_id}`);
  } catch (err: any) {
    console.error(`[Pattern Worker] Failed to update snapshot:`, err.message);
    // Don't re-throw — extraction was persisted successfully
  }
}
