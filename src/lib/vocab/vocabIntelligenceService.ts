import { supabase } from '../db';
import { aiProvider } from '../ai';

export interface VocabularyWord {
  word: string;
  normalized_word: string;
  frequency: number;
  first_seen: string;
  last_seen: string;
  semantic_meaning: string;
  context: string;
  confidence: number;
  entry_ids: string[];
}

export interface VocabularySnapshotData {
  top_words: any[];
  clusters: any[];
  counts: {
    entriesCount: number;
    distinctWordCount: number;
    mostUsedWord: string;
    mostUsedFrequency: number;
  };
  timeline: { date: string; count: number }[];
  emerging: string[];
  new_words: string[];
  dropped_words: string[];
}

export class VocabularyIntelligenceService {
  /**
   * Fetches vocabulary analytics for the user's current overall state (all-time).
   */
  static async getVocabularyOverview(userId: string, forceAudit = false): Promise<any> {
    console.log(`[Vocab Intelligence] Fetching overview for user ${userId}...`);

    // 1. Fetch user's entries and thread responses to determine availability
    const { data: entries, error: entriesErr } = await supabase
      .from('entries')
      .select('id, cycle_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (entriesErr) throw entriesErr;

    const entriesCount = entries?.length || 0;
    if (entriesCount === 0) {
      return {
        isAvailable: false,
        stats: { entriesCount: 0, distinctWordCount: 0, mostUsedWord: 'none', mostUsedFrequency: 0 },
        mostUsed: [],
        timeline: [],
        clusters: [],
        allWords: { frequent: [], occasional: [], usedOnce: [] }
      };
    }

    // 2. Fetch all raw extractions chronologically
    const { data: extractions, error: extErr } = await supabase
      .from('vocab_extractions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (extErr) throw extErr;

    const totalExtractionsCount = extractions?.length || 0;

    // 3. Get active or most recent cycle
    const { data: activeCycle } = await supabase
      .from('cycles')
      .select('id, cycle_number, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const activeCycleId = activeCycle?.id;

    // 4. Aggregate vocabulary items in memory
    const wordGroups = new Map<string, any>();
    extractions?.forEach((ext: any) => {
      const norm = ext.normalized_word.toLowerCase().trim();
      const verbatimWord = ext.original_word || ext.word;
      const sentenceContext = ext.sentence_context || ext.sentence;
      const reasoning = ext.sentence_reasoning || '';

      if (!wordGroups.has(norm)) {
        wordGroups.set(norm, {
          word: verbatimWord,
          normalized_word: norm,
          frequency: 0,
          first_seen: ext.created_at,
          last_seen: ext.created_at,
          semantic_meaning: reasoning,
          context: sentenceContext,
          confidence: ext.confidence || 1.0,
          entry_ids: [],
          audit_trail: []
        });
      }

      const group = wordGroups.get(norm);
      group.frequency += 1;
      
      const docId = ext.entry_id || ext.thread_id || ext.thread_response_id;
      if (docId && !group.entry_ids.includes(docId)) {
        group.entry_ids.push(docId);
      }

      // Populate audit trail
      group.audit_trail.push({
        entry_id: docId,
        sentence: sentenceContext,
        date: new Date(ext.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        type: ext.entry_id ? 'Journal Entry' : 'Thread Response',
        extractor_version: ext.extractor_version || '2.0',
        prompt_version: ext.prompt_version || '2.0',
        provider: ext.provider || 'unknown',
        model: ext.model || 'unknown',
        confidence: ext.confidence || 1.0,
        reason: reasoning
      });

      // Update first/last seen and latest verbatim mapping
      const extTime = new Date(ext.created_at).getTime();
      if (extTime < new Date(group.first_seen).getTime()) {
        group.first_seen = ext.created_at;
      }
      if (extTime >= new Date(group.last_seen).getTime()) {
        group.last_seen = ext.created_at;
        group.word = verbatimWord;
        group.context = sentenceContext;
        group.semantic_meaning = reasoning || group.semantic_meaning;
      }
    });

    const allWordsList = Array.from(wordGroups.values());
    const distinctWordCount = allWordsList.length;

    // Sort by frequency descending
    const sortedWords = [...allWordsList].sort((a, b) => b.frequency - a.frequency);
    const mostUsedWord = sortedWords[0]?.normalized_word || 'none';
    const mostUsedFrequency = sortedWords[0]?.frequency || 0;

    // Build timeline: distinct words discovered cumulatively
    const timeline: { date: string; count: number }[] = [];
    const timelineSorted = [...allWordsList].sort((a, b) => new Date(a.first_seen).getTime() - new Date(b.first_seen).getTime());
    timelineSorted.forEach((w, idx) => {
      timeline.push({
        date: w.first_seen,
        count: idx + 1
      });
    });

    // Group into tiers for All Words Panel
    const frequent = sortedWords.filter(w => w.frequency >= 5).map(w => ({ word: w.word, normalized_word: w.normalized_word, count: w.frequency }));
    const occasional = sortedWords.filter(w => w.frequency >= 2 && w.frequency < 5).map(w => ({ word: w.word, normalized_word: w.normalized_word, count: w.frequency }));
    const usedOnce = sortedWords.filter(w => w.frequency === 1).map(w => ({ word: w.word, normalized_word: w.normalized_word, count: w.frequency }));

    // 5. Generate and Cache clusters if necessary
    let clusters: any[] = [];
    if (activeCycleId && sortedWords.length > 0) {
      clusters = await this.getOrGenerateClusters(userId, activeCycleId, sortedWords, totalExtractionsCount);
    }

    // 6. Build Shift Signals (Dynamic comparison)
    const shiftSignals = await this.computeShiftSignals(userId, activeCycleId, wordGroups, entries);

    const result: any = {
      isAvailable: true,
      stats: {
        entriesCount,
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

    // Include audit trail only if requested (dev mode or query flag)
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
        entry_ids: w.entry_ids,
        audit_trail: w.audit_trail
      }));
    }

    return result;
  }

  /**
   * Fetches vocabulary analytics grouped by cycle.
   */
  static async getVocabularyByCycle(userId: string): Promise<any[]> {
    console.log(`[Vocab Intelligence] Fetching by-cycle breakdown for user ${userId}...`);

    // Fetch all cycles ordered chronologically
    const { data: cycles, error: cyclesErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .order('cycle_number', { ascending: true });

    if (cyclesErr) throw cyclesErr;

    const { data: extractions, error: extErr } = await supabase
      .from('vocab_extractions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (extErr) throw extErr;

    // Map extractions by cycle
    const cycleExtractionsMap = new Map<string, any[]>();
    extractions?.forEach((ext: any) => {
      const arr = cycleExtractionsMap.get(ext.cycle_id) || [];
      arr.push(ext);
      cycleExtractionsMap.set(ext.cycle_id, arr);
    });

    const cycleBreakdowns: any[] = [];
    const allSeenWordsSoFar = new Set<string>();

    for (let i = 0; i < (cycles || []).length; i++) {
      const cy = cycles[i];
      const cyId = cy.id;
      const isActive = cy.status?.toUpperCase() === 'ACTIVE';

      // Check if snapshot exists for completed cycle
      if (!isActive) {
        const { data: snapshot } = await supabase
          .from('vocab_snapshots')
          .select('snapshot_data')
          .eq('cycle_id', cyId)
          .maybeSingle();

        if (snapshot && snapshot.snapshot_data) {
          cycleBreakdowns.push({
            id: cyId,
            number: cy.cycle_number !== undefined ? cy.cycle_number : cy.number,
            status: cy.status,
            started_at: cy.start_date || cy.started_at,
            ended_at: cy.end_date || cy.ended_at,
            is_locked: false,
            ...snapshot.snapshot_data
          });

          // Add to all-seen set so upcoming cycles compute new words correctly
          const cyExts = cycleExtractionsMap.get(cyId) || [];
          cyExts.forEach(e => allSeenWordsSoFar.add(e.normalized_word.toLowerCase().trim()));
          continue;
        }
      }

      // Compute aggregates for the active or un-cached cycle
      const cyExts = cycleExtractionsMap.get(cyId) || [];
      const cyWordsMap = new Map<string, any>();

      cyExts.forEach((ext: any) => {
        const norm = ext.normalized_word.toLowerCase().trim();
        const verbatimWord = ext.original_word || ext.word;
        if (!cyWordsMap.has(norm)) {
          cyWordsMap.set(norm, { word: verbatimWord, normalized_word: norm, frequency: 0 });
        }
        cyWordsMap.get(norm).frequency += 1;
      });

      const cyWordsList = Array.from(cyWordsMap.values());
      const sortedCyWords = [...cyWordsList].sort((a, b) => b.frequency - a.frequency);
      const mostUsed = sortedCyWords.slice(0, 3).map(w => ({ word: w.word, normalized_word: w.normalized_word, frequency: w.frequency }));

      // Find new words (words first seen in this cycle)
      const newWords: string[] = [];
      cyWordsList.forEach(w => {
        if (!allSeenWordsSoFar.has(w.normalized_word)) {
          newWords.push(w.normalized_word);
        }
      });

      // Add current words to seen history
      cyWordsList.forEach(w => allSeenWordsSoFar.add(w.normalized_word));

      // Find dropped words: words used in preceding cycle but not in this cycle
      let droppedWords: string[] = [];
      if (i > 0) {
        const prevCycleId = cycles[i - 1].id;
        const prevExts = cycleExtractionsMap.get(prevCycleId) || [];
        const prevWordsSet = new Set(prevExts.map(e => e.normalized_word.toLowerCase().trim()));
        droppedWords = Array.from(prevWordsSet).filter(w => !cyWordsMap.has(w));
      }

      // Counts entries in this cycle
      const { count: entryCount } = await supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('cycle_id', cyId)
        .eq('user_id', userId);

      // Fetch clusters for this cycle
      const clusters = await this.getOrGenerateClusters(userId, cyId, sortedCyWords, cyExts.length);

      const snapshotPayload = {
        entry_count: entryCount || 0,
        most_used: mostUsed,
        new_words: newWords,
        dropped_words: droppedWords,
        clusters
      };

      // Save snapshot if cycle is completed
      if (!isActive && cyExts.length > 0) {
        await supabase
          .from('vocab_snapshots')
          .upsert({
            user_id: userId,
            cycle_id: cyId,
            snapshot_data: snapshotPayload
          }, { onConflict: 'user_id,cycle_id' });
      }

      cycleBreakdowns.push({
        id: cyId,
        number: cy.cycle_number !== undefined ? cy.cycle_number : cy.number,
        status: cy.status,
        started_at: cy.start_date || cy.started_at,
        ended_at: cy.end_date || cy.ended_at,
        is_locked: isActive,
        ...snapshotPayload
      });
    }

    // Return reversed (most recent cycle first)
    return cycleBreakdowns.reverse();
  }

  /**
   * Returns clusters for a cycle. Generates them via AI if missing or if significant changes occur.
   */
  private static async getOrGenerateClusters(
    userId: string,
    cycleId: string,
    sortedWords: any[],
    totalExtractionsCount: number
  ): Promise<any[]> {
    // 1. Check if clusters are already cached in DB
    const { data: cachedClusters, error: fetchErr } = await supabase
      .from('vocab_clusters')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId);

    if (fetchErr) {
      console.error(`[Vocab Clusters] Error fetching cached clusters:`, fetchErr.message);
    }

    const currentTop3Words = sortedWords.slice(0, 3).map(w => w.normalized_word);

    // 2. Evaluate if regeneration is needed
    let needsRegen = false;
    if (!cachedClusters || cachedClusters.length === 0) {
      needsRegen = true;
    } else {
      // Check if cluster anchor names match current Top 3 words
      const cachedNames = cachedClusters.map(cl => cl.cluster_name.toLowerCase().trim());
      const top3Match = currentTop3Words.every(w => cachedNames.includes(w));
      if (!top3Match) {
        console.log(`[Vocab Clusters] Top 3 words changed. Triggering cluster regeneration...`);
        needsRegen = true;
      } else {
        // Retrieve count of extractions when last generated. If we have 5 or more new extractions since, regenerate
        // For simplicity, we compare total cached cluster word frequency with current extraction count
        const totalClusterFreq = cachedClusters.reduce((sum, c) => sum + (c.frequency || 0), 0);
        if (totalExtractionsCount - totalClusterFreq >= 5) {
          console.log(`[Vocab Clusters] Significant data drift (>= 5 occurrences). Regenerating...`);
          needsRegen = true;
        }
      }
    }

    const performRegen = async () => {
      console.log(`[Vocab Clusters] Generating AI word clusters in the background for top words: ${currentTop3Words.join(', ')}`);
      try {
        const wordsToGenerate = sortedWords.slice(0, 3).map(w => ({
          word: w.word,
          normalized_word: w.normalized_word,
          frequency: w.frequency,
          semantic_meaning: w.semantic_meaning
        }));

        const aiResponse = await aiProvider.groupClusters(wordsToGenerate);
        const generatedClusters = aiResponse.clusters || [];

        // Clear existing clusters for this cycle
        await supabase
          .from('vocab_clusters')
          .delete()
          .eq('user_id', userId)
          .eq('cycle_id', cycleId);

        for (const cl of generatedClusters) {
          const clusterName = cl.cluster_name || '';
          if (!clusterName) continue;

          const clusterWords = cl.words || [];

          const { error: insErr } = await supabase
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

          if (insErr) {
            console.error(`[Vocab Clusters] Failed to cache cluster "${clusterName}":`, insErr.message);
          }
        }
        console.log(`[Vocab Clusters] AI word clusters cached successfully in the background.`);
      } catch (err: any) {
        console.error(`[Vocab Clusters] Background AI generation failed:`, err.message || err);
      }
    };

    if (needsRegen && currentTop3Words.length > 0) {
      // Trigger background generation (floating promise, don't await)
      performRegen();
    }

    // Return currently cached clusters immediately if any
    if (cachedClusters && cachedClusters.length > 0) {
      return cachedClusters.map(cl => ({
        id: cl.id,
        cluster_name: cl.cluster_name,
        description: cl.description || 'A recurring semantic pattern discovered from your logs.',
        confidence: cl.confidence || 0.9,
        words: cl.words || []
      }));
    }

    return [];
  }

  /**
   * Helper to compute shift signals comparing current cycle to prior cycles.
   */
  private static async computeShiftSignals(
    userId: string,
    activeCycleId: string | undefined,
    currentWordGroups: Map<string, any>,
    entries: any[]
  ): Promise<{ last: string[]; six: string[]; all: string[] }> {
    const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
    const result = { last: [] as string[], six: [] as string[], all: [] as string[] };
    if (!activeCycleId) return result;

    // Fetch all cycles ordered chronologically
    const { data: cycles } = await supabase
      .from('cycles')
      .select('id, cycle_number, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!cycles || cycles.length < 2) {
      const emptyMsg = 'Your vocabulary tracking has started in Cycle 1. Compare shifts once you progress to Cycle 2.';
      return { last: [emptyMsg], six: [emptyMsg], all: [emptyMsg] };
    }

    const activeCycleIdx = cycles.length - 1;

    // Fetch all user extractions to compute counts for previous cycles
    const { data: extractions } = await supabase
      .from('vocab_extractions')
      .select('normalized_word, cycle_id')
      .eq('user_id', userId);

    const getCycleWordCounts = (cycleId: string) => {
      const counts = new Map<string, number>();
      extractions?.filter(e => e.cycle_id === cycleId).forEach(e => {
        const norm = e.normalized_word.toLowerCase().trim();
        counts.set(norm, (counts.get(norm) || 0) + 1);
      });
      return counts;
    };

    const activeCounts = getCycleWordCounts(cycles[activeCycleIdx].id);

    // Active cycle top words (up to 3)
    const activeTop3 = Array.from(activeCounts.entries())
      .map(([word, freq]) => ({ word, frequency: freq }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);

    const buildSignalsForComparison = (startCounts: Map<string, number>, startLabel: string, endLabel: string) => {
      const signals: string[] = [];

      // 1. Check if active cycle top words has decreased compared to starting cycle
      if (activeTop3.length > 0) {
        const topWord = activeTop3[0].word;
        const currFreq = activeCounts.get(topWord) || 0;
        const prevFreq = startCounts.get(topWord) || 0;
        if (prevFreq > 0 && currFreq < prevFreq) {
          signals.push(
            `"${cap(topWord)}" appeared ${Math.round(prevFreq)}× in ${startLabel} and ${currFreq}× in ${endLabel} — still your most used word, but less so. Something is loosening.`
          );
        }
      }

      // 2. Identify new words
      const newWords = Array.from(activeCounts.keys())
        .filter(w => !startCounts.has(w) || startCounts.get(w) === 0)
        .slice(0, 2);
      if (newWords.length > 0) {
        const displayNew = newWords.map(w => `"${cap(w)}"`).join(' and ');
        signals.push(`${displayNew} ${newWords.length === 1 ? 'is new' : 'are new'} since ${startLabel} — now appearing in ${endLabel}. More specific than what it replaced.`);
      }

      // 3. Identify dropped words
      const droppedWords = Array.from(startCounts.keys())
        .filter(w => !activeCounts.has(w) || activeCounts.get(w) === 0)
        .slice(0, 2);
      if (droppedWords.length > 0) {
        const displayDropped = droppedWords.map(w => `"${cap(w)}"`).join(' and ');
        signals.push(`${displayDropped} dropped away in ${endLabel}. You started reaching for more precise words.`);
      }

      // 4. Identify words with significant frequency change
      Array.from(activeCounts.keys()).forEach(w => {
        const startVal = startCounts.get(w) || 0;
        const endVal = activeCounts.get(w) || 0;
        if (startVal > 0 && endVal > 0 && startVal !== endVal) {
          const delta = endVal - startVal;
          if (Math.abs(delta) >= 2) {
            const dir = delta < 0 ? 'dropped' : 'increased';
            const tail = delta < 0 ? 'Something is loosening.' : 'Worth noticing what keeps bringing you back to it.';
            signals.push(`"${cap(w)}" ${dir} from ${Math.round(startVal)}× in ${startLabel} to ${endVal}× in ${endLabel} — ${tail}`);
          }
        }
      });

      if (signals.length === 0) {
        signals.push('Your emotional vocabulary held steady across this window.');
      }
      return signals.slice(0, 3);
    };

    // Last cycle
    const lastCycle = cycles[activeCycleIdx - 1];
    const lastCounts = getCycleWordCounts(lastCycle.id);
    result.last = buildSignalsForComparison(
      lastCounts,
      `Cycle ${lastCycle.cycle_number || 1}`,
      `Cycle ${cycles[activeCycleIdx].cycle_number || 1}`
    );

    // Since Cycle 1
    const firstCycle = cycles[0];
    const firstCounts = getCycleWordCounts(firstCycle.id);
    result.all = buildSignalsForComparison(
      firstCounts,
      'Cycle 1',
      `Cycle ${cycles[activeCycleIdx].cycle_number || 1}`
    );

    // Last 6 cycles
    const startIdx = Math.max(0, activeCycleIdx - 6);
    const endIdx = activeCycleIdx - 1;
    const numCyclesCompare = endIdx - startIdx + 1;
    const sixCounts = new Map<string, number>();

    for (let idx = startIdx; idx <= endIdx; idx++) {
      const cyCounts = getCycleWordCounts(cycles[idx].id);
      cyCounts.forEach((val, key) => {
        sixCounts.set(key, (sixCounts.get(key) || 0) + val);
      });
    }
    sixCounts.forEach((val, key) => {
      sixCounts.set(key, val / numCyclesCompare);
    });

    const sixStartLabel = `${numCyclesCompare} cycles ago`;
    result.six = buildSignalsForComparison(
      sixCounts,
      sixStartLabel,
      `Cycle ${cycles[activeCycleIdx].cycle_number || 1}`
    );

    return result;
  }
}
