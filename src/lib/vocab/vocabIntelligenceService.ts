import { supabase } from '../db';

export interface VocabularySnapshotData {
  entry_count: number;
  words: {
    word: string;
    normalized_word: string;
    frequency: number;
    first_seen: string;
    last_seen: string;
    semantic_meaning: string;
    context: string;
    confidence: number;
    entry_ids: string[];
  }[];
  most_used: { word: string; normalized_word: string; frequency: number }[];
  new_words: string[];
  dropped_words: string[];
  clusters: {
    cluster_name: string;
    description: string;
    confidence: number;
    words: string[];
  }[];
}

export class VocabularyIntelligenceService {
  /**
   * Fetches vocabulary analytics for the user's overall state (all-time).
   * Reads exclusively from database snapshots.
   */
  static async getVocabularyOverview(userId: string, forceAudit = false): Promise<any> {
    console.log(`[Vocab Intelligence] Fetching overview for user ${userId}...`);

    // 1. Fetch all cycle snapshots ordered by generated_at ascending
    const { data: dbSnaps, error: snapsErr } = await supabase
      .from('vocab_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: true });

    if (snapsErr) throw snapsErr;

    // Filter out dummy or completed indicator snapshots
    const snapshots = (dbSnaps || []).filter(s => s.cycle_id !== '00000000-0000-0000-0000-000000000000' && s.cycle_id !== '11111111-1111-1111-1111-111111111111');

    if (snapshots.length === 0) {
      // Check if user has any entries at all
      const { count: entryCount } = await supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      return {
        isAvailable: false,
        stats: { entriesCount: entryCount || 0, distinctWordCount: 0, mostUsedWord: 'none', mostUsedFrequency: 0 },
        mostUsed: [],
        timeline: [],
        clusters: [],
        allWords: { frequent: [], occasional: [], usedOnce: [] },
        shiftSignals: { last: [], six: [], all: [] }
      };
    }

    // 2. Aggregate all word groups in memory from cycle snapshots
    const wordGroups = new Map<string, any>();
    let totalEntriesCount = 0;

    snapshots.forEach(snap => {
      const data = snap.snapshot_data as VocabularySnapshotData;
      if (!data) return;

      totalEntriesCount += data.entry_count || 0;
      const cyWords = data.words || [];

      cyWords.forEach(w => {
        const norm = w.normalized_word.toLowerCase().trim();
        if (!wordGroups.has(norm)) {
          wordGroups.set(norm, {
            word: w.word,
            normalized_word: norm,
            frequency: 0,
            first_seen: w.first_seen || snap.generated_at,
            last_seen: w.last_seen || snap.generated_at,
            semantic_meaning: w.semantic_meaning,
            context: w.context,
            confidence: w.confidence || 1.0,
            entry_ids: [],
            audit_trail: []
          });
        }

        const group = wordGroups.get(norm);
        group.frequency += w.frequency || 0;
        
        (w.entry_ids || []).forEach(id => {
          if (!group.entry_ids.includes(id)) {
            group.entry_ids.push(id);
          }
        });

        // Track first/last seen
        const groupFirstTime = new Date(group.first_seen).getTime();
        const wFirstTime = new Date(w.first_seen || snap.generated_at).getTime();
        if (wFirstTime < groupFirstTime) {
          group.first_seen = w.first_seen || snap.generated_at;
        }

        const groupLastTime = new Date(group.last_seen).getTime();
        const wLastTime = new Date(w.last_seen || snap.generated_at).getTime();
        if (wLastTime >= groupLastTime) {
          group.last_seen = w.last_seen || snap.generated_at;
          group.word = w.word;
          group.context = w.context;
          group.semantic_meaning = w.semantic_meaning || group.semantic_meaning;
        }
      });
    });

    const allWordsList = Array.from(wordGroups.values());
    const distinctWordCount = allWordsList.length;

    // Sort by frequency descending
    const sortedWords = [...allWordsList].sort((a, b) => b.frequency - a.frequency);
    const mostUsedWord = sortedWords[0]?.normalized_word || 'none';
    const mostUsedFrequency = sortedWords[0]?.frequency || 0;

    // Build discovery timeline
    const timelineSorted = [...allWordsList].sort((a, b) => new Date(a.first_seen).getTime() - new Date(b.first_seen).getTime());
    const timeline = timelineSorted.map((w, idx) => ({
      date: w.first_seen,
      count: idx + 1
    }));

    // Group into tiers
    const frequent = sortedWords.filter(w => w.frequency >= 5).map(w => ({ word: w.word, normalized_word: w.normalized_word, count: w.frequency }));
    const occasional = sortedWords.filter(w => w.frequency >= 2 && w.frequency < 5).map(w => ({ word: w.word, normalized_word: w.normalized_word, count: w.frequency }));
    const usedOnce = sortedWords.filter(w => w.frequency === 1).map(w => ({ word: w.word, normalized_word: w.normalized_word, count: w.frequency }));

    // Get clusters from the latest snapshot
    const latestSnap = snapshots[snapshots.length - 1];
    const latestData = latestSnap.snapshot_data as VocabularySnapshotData;
    const clusters = latestData?.clusters || [];

    // Compute shifts using pre-compiled snapshot aggregates
    const shiftSignals = await this.computeShiftSignalsFromSnapshots(snapshots);

    const result: any = {
      isAvailable: true,
      stats: {
        entriesCount: totalEntriesCount,
        distinctWordCount,
        mostUsedWord,
        mostUsedFrequency
      },
      mostUsed: sortedWords.slice(0, 10).map(w => ({
        word: w.word,
        normalized_word: w.normalized_word,
        frequency: w.frequency,
        first_seen: w.first_seen,
        last_seen: w.last_seen,
        semantic_meaning: w.semantic_meaning,
        context: w.context,
        confidence: w.confidence
      })),
      timeline,
      clusters,
      allWords: { frequent, occasional, usedOnce },
      shiftSignals
    };

    if (forceAudit) {
      result.currentCycleWords = sortedWords.map(w => ({
        word: w.word,
        normalized_word: w.normalized_word,
        frequency: w.frequency,
        first_seen: w.first_seen,
        last_seen: w.last_seen,
        semantic_meaning: w.semantic_meaning,
        context: w.context,
        confidence: w.confidence,
        entry_ids: w.entry_ids
      }));
    }

    return result;
  }

  /**
   * Fetches vocabulary analytics grouped by cycle.
   * Reads exclusively from database snapshots.
   */
  static async getVocabularyByCycle(userId: string): Promise<any[]> {
    console.log(`[Vocab Intelligence] Fetching by-cycle breakdown for user ${userId}...`);

    // 1. Fetch user cycles ordered chronologically
    const { data: cycles, error: cyclesErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .order('cycle_number', { ascending: true });

    if (cyclesErr) throw cyclesErr;

    // 2. Fetch all snapshots
    const { data: dbSnaps, error: snapsErr } = await supabase
      .from('vocab_snapshots')
      .select('*')
      .eq('user_id', userId);

    if (snapsErr) throw snapsErr;

    const snapMap = new Map<string, any>();
    dbSnaps?.forEach(s => snapMap.set(s.cycle_id, s));

    const cycleBreakdowns: any[] = [];

    (cycles || []).forEach(cy => {
      const cyId = cy.id;
      const snap = snapMap.get(cyId);
      const isActive = cy.status?.toUpperCase() === 'ACTIVE';

      if (snap) {
        const data = snap.snapshot_data as VocabularySnapshotData;
        cycleBreakdowns.push({
          id: cyId,
          number: cy.cycle_number !== undefined ? cy.cycle_number : cy.number,
          status: cy.status,
          started_at: cy.start_date || cy.started_at,
          ended_at: cy.end_date || cy.ended_at,
          is_locked: !isActive,
          entry_count: data.entry_count || 0,
          most_used: data.most_used || [],
          new_words: data.new_words || [],
          dropped_words: data.dropped_words || [],
          clusters: data.clusters || []
        });
      } else {
        // Safe fallback payload for cycles with no snapshot yet
        cycleBreakdowns.push({
          id: cyId,
          number: cy.cycle_number !== undefined ? cy.cycle_number : cy.number,
          status: cy.status,
          started_at: cy.start_date || cy.started_at,
          ended_at: cy.end_date || cy.ended_at,
          is_locked: !isActive,
          entry_count: 0,
          most_used: [],
          new_words: [],
          dropped_words: [],
          clusters: []
        });
      }
    });

    return cycleBreakdowns.reverse();
  }

  /**
   * Generates or fetches clusters for a cycle. Called strictly in the background worker.
   */
  static async backgroundGenerateClusters(
    userId: string,
    cycleId: string,
    sortedWords: any[]
  ): Promise<any[]> {
    const currentTop3Words = sortedWords.slice(0, 3).map(w => w.normalized_word);
    if (currentTop3Words.length === 0) return [];

    console.log(`[Vocab Clusters] Generating AI word clusters for top words: ${currentTop3Words.join(', ')}`);
    try {
      const { aiProvider } = await import('../ai/factory');
      const wordsToGenerate = sortedWords.slice(0, 3).map(w => ({
        word: w.word,
        normalized_word: w.normalized_word,
        frequency: w.frequency,
        semantic_meaning: w.semantic_meaning || 'Recurring emotional theme'
      }));

      const aiResponse = await aiProvider.groupClusters(wordsToGenerate);
      const generatedClusters = aiResponse.clusters || [];

      // Save to vocab_clusters cache table
      await supabase
        .from('vocab_clusters')
        .delete()
        .eq('user_id', userId)
        .eq('cycle_id', cycleId);

      const savedClusters: any[] = [];
      for (const cl of generatedClusters) {
        const clusterName = cl.cluster_name || '';
        if (!clusterName) continue;

        const clusterWords = cl.words || [];
        await supabase
          .from('vocab_clusters')
          .insert({
            user_id: userId,
            cycle_id: cycleId,
            cluster_name: clusterName,
            cluster_type: 'emotional',
            words: clusterWords,
            description: cl.description,
            confidence: cl.confidence || 0.9,
            word_count: clusterWords.length
          });

        savedClusters.push({
          cluster_name: clusterName,
          description: cl.description || 'Recurring emotional theme.',
          confidence: cl.confidence || 0.9,
          words: clusterWords
        });
      }
      return savedClusters;
    } catch (err: any) {
      console.error(`[Vocab Clusters] Background AI cluster generation failed:`, err.message || err);
      return [];
    }
  }

  /**
   * Helper to compute shift signals comparing pre-compiled snapshots.
   */
  private static async computeShiftSignalsFromSnapshots(
    snapshots: any[]
  ): Promise<{ last: string[]; six: string[]; all: string[] }> {
    const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
    const result = { last: [] as string[], six: [] as string[], all: [] as string[] };
    if (snapshots.length < 2) {
      const emptyMsg = 'Your vocabulary tracking has started in Cycle 1. Compare shifts once you progress to Cycle 2.';
      return { last: [emptyMsg], six: [emptyMsg], all: [emptyMsg] };
    }

    const activeSnap = snapshots[snapshots.length - 1];
    const activeData = activeSnap.snapshot_data as VocabularySnapshotData;
    const activeCounts = new Map<string, number>();
    (activeData.words || []).forEach(w => activeCounts.set(w.normalized_word, w.frequency));

    const activeTop3 = (activeData.most_used || []).slice(0, 3);

    const buildSignals = (prevWordsList: any[], prevLabel: string, endLabel: string) => {
      const signals: string[] = [];
      const prevCounts = new Map<string, number>();
      prevWordsList.forEach(w => prevCounts.set(w.normalized_word, w.frequency));

      // Check if top word frequency decreased
      if (activeTop3.length > 0) {
        const topWord = activeTop3[0].normalized_word;
        const currFreq = activeCounts.get(topWord) || 0;
        const prevFreq = prevCounts.get(topWord) || 0;
        if (prevFreq > 0 && currFreq < prevFreq) {
          signals.push(
            `"${cap(topWord)}" appeared ${prevFreq}× in ${prevLabel} and ${currFreq}× in ${endLabel} — still your most used word, but less so. Something is loosening.`
          );
        }
      }

      // Check for new words
      const newWords = Array.from(activeCounts.keys())
        .filter(w => !prevCounts.has(w) || prevCounts.get(w) === 0)
        .slice(0, 2);
      if (newWords.length > 0) {
        const displayNew = newWords.map(w => `"${cap(w)}"`).join(' and ');
        signals.push(`${displayNew} ${newWords.length === 1 ? 'is new' : 'are new'} since ${prevLabel} — now appearing in ${endLabel}.`);
      }

      // Check for dropped words
      const droppedWords = Array.from(prevCounts.keys())
        .filter(w => !activeCounts.has(w) || activeCounts.get(w) === 0)
        .slice(0, 2);
      if (droppedWords.length > 0) {
        const displayDropped = droppedWords.map(w => `"${cap(w)}"`).join(' and ');
        signals.push(`${displayDropped} dropped away in ${endLabel}.`);
      }

      if (signals.length === 0) {
        signals.push('Your emotional vocabulary held steady across this window.');
      }
      return signals.slice(0, 3);
    };

    // Last cycle comparison
    const lastSnap = snapshots[snapshots.length - 2];
    const lastData = lastSnap.snapshot_data as VocabularySnapshotData;
    result.last = buildSignals(lastData.words || [], `Cycle ${snapshots.length - 1}`, `Cycle ${snapshots.length}`);

    // Cycle 1 comparison
    const firstSnap = snapshots[0];
    const firstData = firstSnap.snapshot_data as VocabularySnapshotData;
    result.all = buildSignals(firstData.words || [], 'Cycle 1', `Cycle ${snapshots.length}`);

    // Last 6 cycles comparison
    const sixStartIdx = Math.max(0, snapshots.length - 7);
    const sixEndIdx = snapshots.length - 2;
    const compareCount = sixEndIdx - sixStartIdx + 1;
    const sixMergedWords = new Map<string, number>();

    for (let idx = sixStartIdx; idx <= sixEndIdx; idx++) {
      const snapData = snapshots[idx].snapshot_data as VocabularySnapshotData;
      (snapData.words || []).forEach(w => {
        sixMergedWords.set(w.normalized_word, (sixMergedWords.get(w.normalized_word) || 0) + w.frequency);
      });
    }

    const sixWordsList = Array.from(sixMergedWords.entries()).map(([normalized_word, frequency]) => ({
      normalized_word,
      frequency: frequency / compareCount
    }));

    result.six = buildSignals(sixWordsList, `${compareCount} cycles ago`, `Cycle ${snapshots.length}`);

    return result;
  }
}
