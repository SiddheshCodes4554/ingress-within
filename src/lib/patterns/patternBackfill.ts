import { supabase } from '../db';
import { decrypt } from '../encryption';
import { extractPatternsFromEntry, getHistoricalPatternNames } from './patternExtractor';
import { PatternIntelligenceService } from './patternIntelligenceService';
import { updateBackfillStatus } from './patternBackfillStatus';

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

  try {
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
      await updateBackfillStatus(userId, {
        status: 'COMPLETED',
        snapshot_created: false,
        completed_at: new Date().toISOString()
      });
      return result;
    }

    // 1b. Count total entries, thread responses, and weekly summaries to process for estimating progress
    const [{ count: weeklySummariesCount }] = await Promise.all([
      supabase.from('weekly_summaries').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'READY'),
    ]);

    const totalMilestones = weeklySummariesCount || 0;

    await updateBackfillStatus(userId, {
      status: 'PROCESSING',
      progress_total_cycles: cycles.length,
      progress_processed_cycles: 0,
      progress_total_entries: totalMilestones,
      progress_processed_entries: 0,
      started_at: new Date().toISOString(),
      error_message: null
    });

    // Compile snapshots for all milestones chronologically
    console.log(`[Pattern Backfill] Fetching and compiling snapshots for milestones...`);
    const milestones = await PatternIntelligenceService.getMilestones(userId);
    
    // Filter to completed weekly reports only
    const weeklyMilestones = milestones.filter(m => m.type === 'weekly_report' && m.isCompleted);

    for (let mIdx = 0; mIdx < weeklyMilestones.length; mIdx++) {
      const milestone = weeklyMilestones[mIdx];
      const seqNum = mIdx + 1;
      console.log(`[Pattern Backfill] Compiling milestone ${seqNum}/${weeklyMilestones.length}: ${milestone.type} (ID: ${milestone.id})`);
      
      // Force rebuild to true since we are manually rebuilding/backfilling
      await PatternIntelligenceService.generatePatternSnapshotForMilestone(userId, milestone, seqNum, true);
      result.snapshotsCreated++;

      await updateBackfillStatus(userId, {
        progress_processed_entries: seqNum,
        progress_processed_cycles: Math.floor((seqNum / weeklyMilestones.length) * cycles.length)
      });
    }

    result.cyclesProcessed = cycles.length;

    // Mark the backfill as completed on the user's profile so it is never re-triggered.
    try {
      const { error: profileUpdateErr } = await supabase
        .from('profiles')
        .update({ pattern_backfill_completed: true })
        .eq('id', userId);

      if (profileUpdateErr) {
        console.warn('[Pattern Backfill] Could not set pattern_backfill_completed flag:', profileUpdateErr.message);
      } else {
        console.log(`[Pattern Backfill] Marked pattern_backfill_completed = true for user ${userId}`);
      }
    } catch (flagErr: any) {
      console.warn('[Pattern Backfill] Error setting pattern_backfill_completed flag:', flagErr.message);
    }

    await updateBackfillStatus(userId, {
      status: 'COMPLETED',
      snapshot_created: result.snapshotsCreated > 0,
      completed_at: new Date().toISOString()
    });

  } catch (err: any) {
    console.error('[Pattern Backfill] Error during backfill run:', err.message || err);
    await updateBackfillStatus(userId, {
      status: 'FAILED',
      error_message: err.message || String(err),
      failed_at: new Date().toISOString()
    });
    throw err;
  }

  return result;
}

