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

    // 2. Fetch stats
    // A. Entries count
    const { count: entriesCount, error: entriesErr } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // B. All distinct words count
    const { count: distinctWordCount, error: vocabCountErr } = await supabase
      .from('vocab_words')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // C. Most used word (all-time)
    const { data: topAllTimeWords, error: topWordErr } = await supabase
      .from('vocab_words')
      .select('word, normalized_word, frequency')
      .eq('user_id', userId)
      .order('frequency', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Fetch top 10 most used words (all-time)
    const { data: mostUsedAllTime, error: mostUsedErr } = await supabase
      .from('vocab_words')
      .select('word, normalized_word, frequency, cycle_id, first_seen, last_seen')
      .eq('user_id', userId)
      .order('frequency', { ascending: false })
      .limit(10);

    // 4. Fetch top 5 emotional concepts
    const { data: topConcepts, error: conceptsErr } = await supabase
      .from('vocab_concepts')
      .select('concept, frequency, confidence')
      .eq('user_id', userId)
      .order('frequency', { ascending: false })
      .limit(5);

    // 5. Fetch emerging words in this cycle (words first seen in current cycle)
    let emergingWords: any[] = [];
    let currentCycleWordsList: any[] = [];
    if (cycleId) {
      const { data: currentCycleWords } = await supabase
        .from('vocab_words')
        .select('word, normalized_word, frequency, first_seen, last_seen')
        .eq('user_id', userId)
        .eq('cycle_id', cycleId)
        .order('frequency', { ascending: false });

      if (currentCycleWords && currentCycleWords.length > 0) {
        currentCycleWordsList = currentCycleWords;
        // Query to check if these words were seen in older cycles
        const { data: olderCyclesWords } = await supabase
          .from('vocab_words')
          .select('normalized_word')
          .eq('user_id', userId)
          .neq('cycle_id', cycleId);

        const olderSet = new Set(olderCyclesWords?.map(w => w.normalized_word) || []);
        
        // Emerging = words in current cycle that were NOT seen in older cycles
        emergingWords = currentCycleWords
          .filter(w => !olderSet.has(w.normalized_word))
          .map(w => w.normalized_word)
          .slice(0, 5);
      }
    }

    // 6. Fetch clusters and their associated words for this cycle
    let mappedClusters: any[] = [];
    if (cycleId) {
      const { data: clusters } = await supabase
        .from('vocab_clusters')
        .select('*')
        .eq('user_id', userId)
        .eq('cycle_id', cycleId);

      if (clusters) {
        for (const cl of clusters) {
          const { data: words } = await supabase
            .from('vocab_words')
            .select('word, normalized_word, frequency')
            .eq('cluster_id', cl.id);

          const wordsList = cl.words || (words ? words.map(w => w.normalized_word) : []);
          
          // Find anchor word (the word with highest frequency in this cluster)
          const anchorWordObj = words && words.length > 0
            ? words.reduce((prev, current) => (prev.frequency > current.frequency ? prev : current))
            : null;

          mappedClusters.push({
            id: cl.id,
            cluster_name: cl.cluster_name,
            cluster_type: cl.cluster_type,
            word_count: cl.word_count || wordsList.length,
            anchor_word: anchorWordObj?.normalized_word || cl.cluster_name,
            anchor_frequency: anchorWordObj?.frequency || cl.frequency || 0,
            words: wordsList,
            frequency: cl.frequency || totalFrequency(words)
          });
        }
      }
    }

    function totalFrequency(words: any[] | null) {
      if (!words) return 0;
      return words.reduce((sum, w) => sum + w.frequency, 0);
    }

    // 7. Fetch timeline: cumulative distinct words over time
    const { data: allWordsSorted } = await supabase
      .from('vocab_words')
      .select('first_seen, normalized_word')
      .eq('user_id', userId)
      .order('first_seen', { ascending: true });

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
    let currentCycleWordsCount = 0;
    if (cycleId) {
      const { count } = await supabase
        .from('vocab_words')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('cycle_id', cycleId);
      currentCycleWordsCount = count || 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          entriesCount: entriesCount || 0,
          distinctWordCount: distinctWordCount || 0,
          mostUsedWord: topAllTimeWords?.normalized_word || 'none',
          mostUsedFrequency: topAllTimeWords?.frequency || 0,
          currentCycleWordsCount
        },
        mostUsed: (mostUsedAllTime || []).map(w => ({
          word: w.word,
          normalized_word: w.normalized_word,
          frequency: w.frequency,
          first_seen: w.first_seen,
          last_seen: w.last_seen
        })),
        concepts: (topConcepts || []).map(c => ({
          concept: c.concept,
          frequency: c.frequency,
          confidence: c.confidence
        })),
        emerging: emergingWords,
        currentCycleWords: currentCycleWordsList,
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
