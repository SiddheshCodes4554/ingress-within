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

    // 1. Fetch active or most recent cycle
    let { data: cycle, error: cycleErr } = await supabase
      .from('cycles')
      .select('id, cycle_number, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cycleErr) {
      console.error('Error fetching cycle:', cycleErr);
    }

    const cycleId = cycle?.id;

    // 2. Check if new personalized columns exist in the database
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

    // Fetch stats
    // A. Entries count
    const { count: entriesCount, error: entriesErr } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Fetch all active cycle words
    let activeCycleWords: any[] = [];
    if (cycleId) {
      const fields = hasNewWordsColumns 
        ? 'id, word, normalized_word, frequency, semantic_meaning, context, confidence, entry_ids, first_seen, last_seen'
        : 'id, word, normalized_word, frequency, first_seen, last_seen';
      
      const { data } = await supabase
        .from('vocab_words')
        .select(fields)
        .eq('user_id', userId)
        .eq('cycle_id', cycleId)
        .eq('is_emotional', true)
        .order('frequency', { ascending: false }) as any;
      activeCycleWords = data || [];
    }

    // B. All distinct words count
    const { count: distinctWordCount, error: vocabCountErr } = await supabase
      .from('vocab_words')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('frequency', 2);

    // B2. Current cycle distinct words count
    let currentCycleWordsCount = 0;
    if (cycleId) {
      const { count: cWordCount } = await supabase
        .from('vocab_words')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('cycle_id', cycleId)
        .gte('frequency', 2);
      currentCycleWordsCount = cWordCount || 0;
    }

    // Fetch all time top words
    const allTimeFields = hasNewWordsColumns 
      ? 'word, normalized_word, frequency, semantic_meaning, context, confidence, entry_ids, first_seen, last_seen'
      : 'word, normalized_word, frequency, first_seen, last_seen';
    
    const { data: mostUsedAllTime } = await supabase
      .from('vocab_words')
      .select(allTimeFields)
      .eq('user_id', userId)
      .eq('is_emotional', true)
      .order('frequency', { ascending: false })
      .limit(10) as any;

    // Fetch top 5 emotional concepts
    const { data: topConcepts } = await supabase
      .from('vocab_concepts')
      .select('concept, frequency, confidence')
      .eq('user_id', userId)
      .order('frequency', { ascending: false })
      .limit(5);

    // 5. Fetch emerging EMOTIONAL words in this cycle
    let emergingWords: any[] = [];
    if (cycleId && activeCycleWords.length > 0) {
      const { data: olderCyclesWords } = await supabase
        .from('vocab_words')
        .select('normalized_word')
        .eq('user_id', userId)
        .eq('is_emotional', true)
        .neq('cycle_id', cycleId);

      const olderSet = new Set(olderCyclesWords?.map(w => w.normalized_word) || []);
      
      // Emerging = emotional words in current cycle that were NOT seen in older cycles
      emergingWords = activeCycleWords
        .filter(w => !olderSet.has(w.normalized_word))
        .map(w => w.normalized_word)
        .slice(0, 5);
    }

    // 6. Fetch clusters and their associated words for this cycle (already filters matching words)
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
          const supportingWordsObj = activeCycleWords.filter(w => clusterWords.includes(w.normalized_word));
          
          // Compute min first_seen and max last_seen
          let firstAppearance = new Date().toISOString();
          let lastAppearance = new Date().toISOString();
          if (supportingWordsObj.length > 0) {
            const firstSeens = supportingWordsObj.map(w => new Date(w.first_seen).getTime());
            const lastSeens = supportingWordsObj.map(w => new Date(w.last_seen).getTime());
            firstAppearance = new Date(Math.min(...firstSeens)).toISOString();
            lastAppearance = new Date(Math.max(...lastSeens)).toISOString();
          }

          // Compute growth trend: compare frequency in current cycle vs previous cycle for these words
          let growthTrend = 'stable';
          
          // Find the previous cycle
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
            const currFreq = cl.frequency || 0;
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

          // Related entries: extract unique entry IDs from supporting words and fetch snippets
          let relatedEntries: any[] = [];
          if (hasNewWordsColumns) {
            const entryIdsSet = new Set<string>();
            supportingWordsObj.forEach(w => {
              if (w.entry_ids && Array.isArray(w.entry_ids)) {
                w.entry_ids.forEach((id: string) => entryIdsSet.add(id));
              }
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
            frequency: cl.frequency || 0,
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

    // 7. Fetch timeline: cumulative distinct EMOTIONAL words over time
    const allWordsQuery = supabase
      .from('vocab_words')
      .select('first_seen, normalized_word')
      .eq('user_id', userId)
      .eq('is_emotional', true)
      .order('first_seen', { ascending: true });
    const { data: allWordsSorted } = await allWordsQuery;

    // Deduplicate normalized words chronologically
    const seenWords = new Set<string>();
    const timeline: { date: string; count: number }[] = [];
    
    if (allWordsSorted) {
      allWordsSorted.forEach(w => {
        if (!seenWords.has(w.normalized_word)) {
          seenWords.add(w.normalized_word);
          timeline.push({
            date: w.first_seen,
            count: seenWords.size
          });
        }
      });
    }

    // 8. Fetch growth metrics
    currentCycleWordsCount = activeCycleWords.length;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          entriesCount: entriesCount || 0,
          distinctWordCount: distinctWordCount || 0,
          mostUsedWord: mostUsedAllTime?.[0]?.normalized_word || 'none',
          mostUsedFrequency: mostUsedAllTime?.[0]?.frequency || 0,
          currentCycleWordsCount
        },
        mostUsed: (mostUsedAllTime || []).map(w => ({
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
        currentCycleWords: activeCycleWords.map(w => ({
          word: w.word,
          normalized_word: w.normalized_word,
          frequency: w.frequency,
          first_seen: w.first_seen,
          last_seen: w.last_seen,
          semantic_meaning: w.semantic_meaning || '',
          context: w.context || '',
          confidence: w.confidence || 1.0,
          entry_ids: w.entry_ids || []
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
