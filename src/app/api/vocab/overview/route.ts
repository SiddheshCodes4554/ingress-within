import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const userId = authUser.userId;

    // Fetch user's first entry
    const { data: firstEntry } = await supabase
      .from('entries')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    let isAvailable = false;
    let daysSinceStart = 0;
    let allowedDays = 0;
    let cutoffTime: Date | null = null;

    // Fetch total entry count
    const { count: entriesCountAllTime } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (firstEntry) {
      const firstEntryTime = new Date(firstEntry.created_at).getTime();
      // Calculate days elapsed (using Math.floor)
      daysSinceStart = Math.floor((Date.now() - firstEntryTime) / (24 * 60 * 60 * 1000));
      if (daysSinceStart >= 3) {
        isAvailable = true;
        allowedDays = Math.floor(daysSinceStart / 3) * 3;
        cutoffTime = new Date(firstEntryTime + allowedDays * 24 * 60 * 60 * 1000);
      }
    }

    if (!isAvailable || !cutoffTime) {
      return NextResponse.json({
        success: true,
        data: {
          isAvailable: false,
          daysSinceStart,
          stats: {
            entriesCount: entriesCountAllTime || 0,
            distinctWordCount: 0,
            mostUsedWord: 'none',
            mostUsedFrequency: 0,
            currentCycleWordsCount: 0
          },
          mostUsed: [],
          concepts: [],
          emerging: [],
          currentCycleWords: [],
          clusters: [],
          timeline: [],
          currentCycle: null
        }
      });
    }

    // 1. Fetch active or most recent cycle
    let { data: cycle, error: cycleErr } = await supabase
      .from('cycles')
      .select('id, cycle_number, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const cycleId = cycle?.id;

    // Check schema options
    let hasNewWordsColumns = false;
    try {
      const { error } = await supabase
        .from('vocab_words')
        .select('semantic_meaning')
        .limit(1);
      if (!error) hasNewWordsColumns = true;
    } catch (_) {}

    let hasNewClustersColumns = false;
    try {
      const { error } = await supabase
        .from('vocab_clusters')
        .select('description')
        .limit(1);
      if (!error) hasNewClustersColumns = true;
    } catch (_) {}

    // A. Fetch filtered entries count
    const { count: entriesCount } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('created_at', cutoffTime.toISOString());

    // B. Fetch raw extractions up to cutoffTime
    const { data: extractions } = await supabase
      .from('vocab_extractions')
      .select('normalized_word, word, confidence, sentence, sentence_reasoning, cycle_id, created_at')
      .eq('user_id', userId)
      .lte('created_at', cutoffTime.toISOString());

    const wordGroups = new Map<string, any>();
    (extractions || []).forEach(ext => {
      const norm = ext.normalized_word.toLowerCase();
      if (!wordGroups.has(norm)) {
        wordGroups.set(norm, {
          word: ext.word,
          normalized_word: norm,
          frequency: 0,
          confidence: ext.confidence,
          first_seen: ext.created_at,
          last_seen: ext.created_at,
          semantic_meaning: ext.sentence_reasoning || '',
          context: ext.sentence || '',
          cycle_id: ext.cycle_id,
          extractions: []
        });
      }
      const g = wordGroups.get(norm);
      g.frequency += 1;
      g.extractions.push(ext);
      if (new Date(ext.created_at).getTime() < new Date(g.first_seen).getTime()) {
        g.first_seen = ext.created_at;
      }
      if (new Date(ext.created_at).getTime() > new Date(g.last_seen).getTime()) {
        g.last_seen = ext.created_at;
        g.word = ext.word;
        g.semantic_meaning = ext.sentence_reasoning || g.semantic_meaning;
        g.context = ext.sentence || g.context;
      }
    });

    const wordsList = Array.from(wordGroups.values());

    // Count of distinct words with frequency >= 2
    const distinctWordCount = wordsList.filter(w => w.frequency >= 2).length;

    // Sorted top words
    const sortedWords = [...wordsList].sort((a, b) => b.frequency - a.frequency);
    const mostUsedWord = sortedWords[0]?.normalized_word || 'none';
    const mostUsedFrequency = sortedWords[0]?.frequency || 0;

    // Current cycle words
    const currentCycleWords = wordsList.filter(w => w.extractions.some((e: any) => e.cycle_id === cycleId));
    const currentCycleWordsCount = currentCycleWords.length;

    // Emerging words (words first seen in current cycle and not in older cycles)
    const emergingWords = currentCycleWords
      .filter(w => w.extractions.every((e: any) => e.cycle_id === cycleId))
      .map(w => w.normalized_word)
      .slice(0, 5);

    // Concepts
    const { data: topConcepts } = await supabase
      .from('vocab_concepts')
      .select('concept, frequency, confidence')
      .eq('user_id', userId)
      .order('frequency', { ascending: false })
      .limit(5);

    // Clusters for this cycle
    let mappedClusters: any[] = [];
    if (cycleId) {
      const selectFields = hasNewClustersColumns 
        ? 'id, cluster_name, cluster_type, words, frequency, confidence, description'
        : 'id, cluster_name, cluster_type, words, frequency';

      let { data: clusters } = await supabase
        .from('vocab_clusters')
        .select(selectFields)
        .eq('user_id', userId)
        .eq('cycle_id', cycleId) as any;

      if (clusters) {
        for (const cl of clusters) {
          const clusterWords = cl.words || [];
          const supportingWordsObj = currentCycleWords.filter(w => clusterWords.includes(w.normalized_word));
          
          if (supportingWordsObj.length === 0) continue;

          let firstAppearance = new Date().toISOString();
          let lastAppearance = new Date().toISOString();
          const firstSeens = supportingWordsObj.map(w => new Date(w.first_seen).getTime());
          const lastSeens = supportingWordsObj.map(w => new Date(w.last_seen).getTime());
          firstAppearance = new Date(Math.min(...firstSeens)).toISOString();
          lastAppearance = new Date(Math.max(...lastSeens)).toISOString();

          let growthTrend = 'stable';
          
          const { data: prevCycle } = await supabase
            .from('cycles')
            .select('id')
            .eq('user_id', userId)
            .lt('created_at', cycle ? (cycle as any).created_at || new Date().toISOString() : new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (prevCycle) {
            const { data: prevWords } = await supabase
              .from('vocab_words')
              .select('frequency')
              .eq('user_id', userId)
              .eq('cycle_id', prevCycle.id)
              .in('normalized_word', clusterWords);
            
            const prevFreq = prevWords ? prevWords.reduce((sum, w) => sum + w.frequency, 0) : 0;
            const currFreq = supportingWordsObj.reduce((sum, w) => sum + w.frequency, 0);
            if (prevFreq > 0) {
              const diffPct = Math.round(((currFreq - prevFreq) / prevFreq) * 100);
              if (diffPct > 10) growthTrend = `growing (+${diffPct}%)`;
              else if (diffPct < -10) growthTrend = `declining (${diffPct}%)`;
            } else if (currFreq > 0) {
              growthTrend = 'emerging';
            }
          } else {
            growthTrend = 'emerging';
          }

          let relatedEntries: any[] = [];
          if (hasNewWordsColumns) {
            const entryIdsSet = new Set<string>();
            supportingWordsObj.forEach(w => {
              w.extractions.forEach((e: any) => {
                if (e.entry_id) entryIdsSet.add(e.entry_id);
              });
            });
            const entryIds = Array.from(entryIdsSet);
            if (entryIds.length > 0) {
              const { data: entries } = await supabase
                .from('entries')
                .select('id, content, created_at')
                .in('id', entryIds)
                .order('created_at', { ascending: false });
              relatedEntries = (entries || []).map(e => ({
                id: e.id,
                created_at: e.created_at,
                snippet: e.content ? e.content.slice(0, 120) + (e.content.length > 120 ? '...' : '') : ''
              }));
            }
          }

          mappedClusters.push({
            id: cl.id,
            cluster_name: cl.cluster_name,
            description: cl.description || 'A recurring semantic pattern discovered from your logs.',
            confidence: cl.confidence || 0.85,
            frequency: supportingWordsObj.reduce((sum, w) => sum + w.frequency, 0),
            first_appearance: firstAppearance,
            last_appearance: lastAppearance,
            growth_trend: growthTrend,
            words: supportingWordsObj.map(w => ({
              word: w.word,
              normalized_word: w.normalized_word,
              frequency: w.frequency,
              semantic_meaning: w.semantic_meaning || '',
              context: w.context || ''
            })),
            related_entries: relatedEntries
          });
        }
      }
    }

    // Timeline construction
    const timeline: { date: string; count: number }[] = [];
    const sortedTimelineWords = [...wordsList].sort((a, b) => new Date(a.first_seen).getTime() - new Date(b.first_seen).getTime());
    sortedTimelineWords.forEach((w, idx) => {
      timeline.push({
        date: w.first_seen,
        count: idx + 1
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        isAvailable: true,
        daysSinceStart,
        stats: {
          entriesCount: entriesCount || 0,
          distinctWordCount,
          mostUsedWord,
          mostUsedFrequency,
          currentCycleWordsCount
        },
        mostUsed: sortedWords.slice(0, 10).map(w => ({
          word: w.word,
          normalized_word: w.normalized_word,
          frequency: w.frequency,
          first_seen: w.first_seen,
          last_seen: w.last_seen,
          semantic_meaning: w.semantic_meaning || ''
        })),
        concepts: (topConcepts || []).map(c => ({
          concept: c.concept,
          frequency: c.frequency,
          confidence: c.confidence
        })),
        emerging: emergingWords,
        currentCycleWords: currentCycleWords.map(w => ({
          word: w.word,
          normalized_word: w.normalized_word,
          frequency: w.frequency,
          first_seen: w.first_seen,
          last_seen: w.last_seen,
          semantic_meaning: w.semantic_meaning || '',
          context: w.context || '',
          confidence: w.confidence || 1.0,
          entry_ids: w.extractions.map((e: any) => e.entry_id).filter(Boolean)
        })),
        clusters: mappedClusters,
        timeline,
        currentCycle: cycle ? {
          id: cycle.id,
          number: cycle.cycle_number,
          status: cycle.status
        } : null
      }
    });

  } catch (error) {
    console.error('Vocab Overview GET Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
