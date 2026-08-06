import { supabase } from '../db';
import { processVocabularyExtraction, compileAndCacheCycleSnapshot } from '../queue/workers/vocabWorker';
import { extractPatternsFromEntry } from '../patterns/patternExtractor';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export interface PeriodicUpdateResult {
  userId: string;
  vocabUpdated: boolean;
  patternsUpdated: boolean;
  entriesProcessed: number;
  lastUpdated: string;
}

/**
 * Checks if emotional vocabulary and patterns for a user are up to date within 3 days.
 * If older than 3 days or if new entries exist, automatically runs background processing.
 */
export async function checkAndRefreshThreeDayIntelligence(userId: string): Promise<PeriodicUpdateResult> {
  console.log(`[3-Day Intelligence Updater] Checking freshness for user ${userId}...`);
  const now = new Date();
  const threeDaysAgoISO = new Date(now.getTime() - THREE_DAYS_MS).toISOString();

  let vocabUpdated = false;
  let patternsUpdated = false;
  let entriesProcessed = 0;

  try {
    // 1. Check latest vocabulary snapshot
    const { data: latestVocabSnap } = await supabase
      .from('vocab_snapshots')
      .select('generated_at')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const vocabLastGenerated = latestVocabSnap?.generated_at ? new Date(latestVocabSnap.generated_at).getTime() : 0;
    const isVocabStale = (now.getTime() - vocabLastGenerated) >= THREE_DAYS_MS;

    // 2. Check latest pattern snapshot
    const { data: latestPatternSnap } = await supabase
      .from('pattern_snapshots')
      .select('generated_at')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const patternLastGenerated = latestPatternSnap?.generated_at ? new Date(latestPatternSnap.generated_at).getTime() : 0;
    const isPatternStale = (now.getTime() - patternLastGenerated) >= THREE_DAYS_MS;

    // 3. Fetch recent journal entries
    const { data: recentEntries } = await supabase
      .from('entries')
      .select('id, content, created_at, vocab_processed')
      .eq('user_id', userId)
      .neq('entry_type', 'empty')
      .order('created_at', { ascending: false })
      .limit(20);

    const hasNewUnprocessedEntries = (recentEntries || []).some(e => !e.vocab_processed);

    // 4. Update Emotional Vocabulary if stale (> 3 days) or new entries exist
    if (isVocabStale || hasNewUnprocessedEntries) {
      console.log(`[3-Day Intelligence Updater] Refreshing emotional vocabulary for user ${userId}...`);
      const unextracted = (recentEntries || []).filter(e => !e.vocab_processed);

      for (const entry of unextracted) {
        try {
          await processVocabularyExtraction({ entry_id: entry.id, user_id: userId, bypass_ai: true });
          entriesProcessed++;
        } catch (err: any) {
          console.warn(`[3-Day Intelligence Updater] Vocab extraction warning for entry ${entry.id}:`, err.message);
        }
      }

      // Re-compile current cycle snapshot
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      const cycleId = activeCycle?.id || 'default_cycle';
      await compileAndCacheCycleSnapshot(userId, cycleId);
      vocabUpdated = true;
    }

    // 5. Update Behavioral Patterns if stale (> 3 days) or new entries exist
    if (isPatternStale || hasNewUnprocessedEntries) {
      console.log(`[3-Day Intelligence Updater] Refreshing behavioral patterns for user ${userId}...`);
      
      const patternOccurrences: Record<string, number> = {};
      const validEntries = (recentEntries || []).filter(e => e.content && e.content.trim().length > 10);

      // Fetch user active cycle
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('id, cycle_number')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      const cycleId = activeCycle?.id || '00000000-0000-0000-0000-000000000001';
      const cycleNumber = activeCycle?.cycle_number || 1;

      for (const entry of validEntries) {
        try {
          const res = await extractPatternsFromEntry({
            entryText: entry.content,
            userId,
            cycleId,
            entryId: entry.id,
            sourceType: 'journal'
          });
          const extracted = (res.candidates || []).map(c => c.pattern_name);
          for (const patName of extracted) {
            patternOccurrences[patName] = (patternOccurrences[patName] || 0) + 1;
          }
        } catch (err: any) {
          console.warn(`[3-Day Intelligence Updater] Pattern extraction warning for entry ${entry.id}:`, err.message);
        }
      }

      const patternCards = Object.entries(patternOccurrences).map(([name, count]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        status: count >= 3 ? 'present' : count === 2 ? 'shifting' : 'new',
        body: `Observed ${count} times in recent entries over the 3-day window.`,
        meta: '3-Day Recurring Window',
        orientation: count >= 3 ? 'high' : 'medium',
        timeline: validEntries.map(e => new Date(e.created_at).toISOString().split('T')[0]),
        firstAppeared: validEntries[validEntries.length - 1]?.created_at || new Date().toISOString(),
        totalOccurrences: count,
        connectedPatterns: []
      }));

      await supabase
        .from('pattern_snapshots')
        .upsert({
          user_id: userId,
          cycle_id: cycleId,
          cycle_number: cycleNumber,
          snapshot_status: 'completed',
          snapshot_data: {
            window_type: '3_day_recurring',
            patterns: patternCards,
            total_entries_analyzed: validEntries.length,
            generated_at: new Date().toISOString()
          },
          generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,cycle_id' });

      patternsUpdated = true;
    }

    return {
      userId,
      vocabUpdated,
      patternsUpdated,
      entriesProcessed,
      lastUpdated: new Date().toISOString()
    };
  } catch (err: any) {
    console.error(`[3-Day Intelligence Updater] Error for user ${userId}:`, err.message);
    return {
      userId,
      vocabUpdated: false,
      patternsUpdated: false,
      entriesProcessed: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Runs 3-day scheduled updates for all active users.
 * Intended to be invoked by Vercel Cron or background task schedulers every 3 days.
 */
export async function runScheduledThreeDayUpdatesForActiveUsers(): Promise<{ usersProcessed: number; results: PeriodicUpdateResult[] }> {
  console.log('[3-Day Intelligence Updater] Starting scheduled 3-day batch update...');
  
  // Find all users active in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: activeUsers } = await supabase
    .from('entries')
    .select('user_id')
    .gte('created_at', thirtyDaysAgo);

  const distinctUserIds = Array.from(new Set((activeUsers || []).map(u => u.user_id)));
  console.log(`[3-Day Intelligence Updater] Found ${distinctUserIds.length} active users to check.`);

  const results: PeriodicUpdateResult[] = [];
  for (const userId of distinctUserIds) {
    const res = await checkAndRefreshThreeDayIntelligence(userId);
    results.push(res);
  }

  return {
    usersProcessed: distinctUserIds.length,
    results
  };
}
