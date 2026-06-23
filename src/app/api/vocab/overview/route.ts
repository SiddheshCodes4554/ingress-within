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

    // 3. Fetch top 5 most used words (all-time or current cycle, let's return all-time for "Most used - all time" section)
    const { data: mostUsedAllTime, error: mostUsedErr } = await supabase
      .from('vocab_words')
      .select('word, normalized_word, frequency, cycle_id')
      .eq('user_id', userId)
      .order('frequency', { ascending: false })
      .limit(5);

    // 4. Fetch emerging words in this cycle (words first seen in current cycle, sorted by last_seen desc)
    let emergingWords: any[] = [];
    if (cycleId) {
      const { data: currentCycleWords } = await supabase
        .from('vocab_words')
        .select('word, normalized_word, frequency, first_seen, last_seen')
        .eq('user_id', userId)
        .eq('cycle_id', cycleId)
        .order('first_seen', { ascending: false });

      if (currentCycleWords) {
        // Query to check if these words were seen in older cycles
        const olderCyclesWords = await supabase
          .from('vocab_words')
          .select('normalized_word')
          .eq('user_id', userId)
          .neq('cycle_id', cycleId);

        const olderSet = new Set(olderCyclesWords.data?.map(w => w.normalized_word) || []);
        
        // Emerging = words in current cycle that were NOT seen in older cycles
        emergingWords = currentCycleWords
          .filter(w => !olderSet.has(w.normalized_word))
          .slice(0, 3)
          .map(w => w.normalized_word);
      }
    }

    // 5. Fetch clusters and their associated words for this cycle
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

          const wordsList = words ? words.map(w => w.normalized_word) : [];
          // Find anchor word (the word with highest frequency in this cluster)
          const anchorWordObj = words && words.length > 0
            ? words.reduce((prev, current) => (prev.frequency > current.frequency ? prev : current))
            : null;

          mappedClusters.push({
            id: cl.id,
            cluster_name: cl.cluster_name,
            cluster_type: cl.cluster_type,
            word_count: cl.word_count,
            anchor_word: anchorWordObj?.normalized_word || cl.cluster_name,
            anchor_frequency: anchorWordObj?.frequency || 0,
            words: wordsList
          });
        }
      }
    }

    // 6. Fetch timeline: cumulative distinct words over time
    const { data: allWordsSorted } = await supabase
      .from('vocab_words')
      .select('first_seen')
      .eq('user_id', userId)
      .order('first_seen', { ascending: true });

    const timeline = (allWordsSorted || []).map((w, idx) => ({
      date: w.first_seen,
      count: idx + 1
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          entriesCount: entriesCount || 0,
          distinctWordCount: distinctWordCount || 0,
          mostUsedWord: topAllTimeWords?.normalized_word || 'none',
          mostUsedFrequency: topAllTimeWords?.frequency || 0
        },
        mostUsed: (mostUsedAllTime || []).map(w => ({
          word: w.word,
          normalized_word: w.normalized_word,
          frequency: w.frequency
        })),
        emerging: emergingWords,
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
