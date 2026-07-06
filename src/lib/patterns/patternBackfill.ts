import { supabase } from '../db';
import { decrypt } from '../encryption';
import { extractPatternsFromEntry, getHistoricalPatternNames } from './patternExtractor';
import { PatternIntelligenceService } from './patternIntelligenceService';

export interface PatternBackfillResult {
  cyclesProcessed: number;
  extractionsCreated: number;
  snapshotsCreated: number;
}

/**
 * Backfills pattern extractions and snapshot history for a specific user.
 * Runs chronologically through all their past and current cycles.
 */
export async function backfillPatterns(userId: string): Promise<PatternBackfillResult> {
  console.log(`[Pattern Backfill] Starting pattern backfill/rebuild for user ${userId}`);

  const result: PatternBackfillResult = {
    cyclesProcessed: 0,
    extractionsCreated: 0,
    snapshotsCreated: 0
  };

  // 1. Fetch all cycles for this user, ordered by creation date ascending
  const { data: cycles, error: cyclesErr } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (cyclesErr) {
    console.error('[Pattern Backfill] Error fetching user cycles:', cyclesErr.message);
    throw cyclesErr;
  }

  if (!cycles || cycles.length === 0) {
    console.log('[Pattern Backfill] No cycles found for user.');
    return result;
  }

  // 2. Loop through each cycle chronologically
  for (let idx = 0; idx < cycles.length; idx++) {
    const cycle = cycles[idx];
    const cycleId = cycle.id;
    const cycleNumber = idx + 1;

    console.log(`[Pattern Backfill] Processing Cycle ${cycleNumber} (ID: ${cycleId})`);

    // A. Fetch journal entries for this cycle
    const { data: entries } = await supabase
      .from('entries')
      .select('id, content, content_iv')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId);

    // B. Fetch thread responses for this cycle
    const { data: threadResponses } = await supabase
      .from('thread_responses')
      .select('id, response_text')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId);

    // C. Fetch weekly summaries for this cycle
    const { data: weeklySummaries } = await supabase
      .from('weekly_summaries')
      .select('id, body')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId);

    // Track historical patterns for this cycle to pass as context
    const historicalPatterns = await getHistoricalPatternNames(userId);

    // Process Journal Entries
    if (entries) {
      for (const entry of entries) {
        // Check if extraction already exists for this entry
        const { data: existing } = await supabase
          .from('pattern_extractions')
          .select('id')
          .eq('user_id', userId)
          .eq('entry_id', entry.id)
          .limit(1);

        if (!existing || existing.length === 0) {
          let entryText = '';
          if (entry.content_iv && entry.content) {
            try {
              entryText = (await decrypt(entry.content, entry.content_iv)) || entry.content;
            } catch {
              entryText = entry.content;
            }
          } else {
            entryText = entry.content || '';
          }

          if (entryText && entryText.trim().length >= 20) {
            await extractPatternsFromEntry({
              entryText,
              userId,
              cycleId,
              entryId: entry.id,
              sourceType: 'journal',
              historicalPatterns
            });
            result.extractionsCreated++;
          }
        }
      }
    }

    // Process Thread Responses
    if (threadResponses) {
      for (const resp of threadResponses) {
        const { data: existing } = await supabase
          .from('pattern_extractions')
          .select('id')
          .eq('user_id', userId)
          .eq('entry_id', resp.id)
          .limit(1);

        if (!existing || existing.length === 0) {
          const entryText = resp.response_text || '';
          if (entryText && entryText.trim().length >= 20) {
            await extractPatternsFromEntry({
              entryText,
              userId,
              cycleId,
              entryId: resp.id,
              sourceType: 'thread',
              historicalPatterns
            });
            result.extractionsCreated++;
          }
        }
      }
    }

    // Process Weekly Summaries
    if (weeklySummaries) {
      for (const summary of weeklySummaries) {
        const { data: existing } = await supabase
          .from('pattern_extractions')
          .select('id')
          .eq('user_id', userId)
          .eq('entry_id', summary.id)
          .limit(1);

        if (!existing || existing.length === 0) {
          const entryText = summary.body || '';
          if (entryText && entryText.trim().length >= 20) {
            await extractPatternsFromEntry({
              entryText,
              userId,
              cycleId,
              entryId: summary.id,
              sourceType: 'weekly_report',
              historicalPatterns
            });
            result.extractionsCreated++;
          }
        }
      }
    }

    // D. Compile Snapshot for this cycle
    const isLatestCycle = idx === cycles.length - 1;
    const isCompleted = cycle.status?.toLowerCase() === 'complete' || 
                        cycle.status?.toLowerCase() === 'completed' || 
                        cycle.status?.toLowerCase() === 'archived' || 
                        !isLatestCycle;

    // Check if snapshot exists
    const { data: existingSnap } = await supabase
      .from('pattern_snapshots')
      .select('id, snapshot_status')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId)
      .maybeSingle();

    if (!existingSnap) {
      await PatternIntelligenceService.generatePatternSnapshot(userId, cycleId);
      result.snapshotsCreated++;
    } else if (existingSnap.snapshot_status === 'active') {
      await PatternIntelligenceService.generatePatternSnapshot(userId, cycleId);
      result.snapshotsCreated++;
    }

    // E. Seal if completed
    if (isCompleted) {
      await PatternIntelligenceService.sealCycleSnapshot(userId, cycleId);
    }

    result.cyclesProcessed++;
  }

  return result;
}
