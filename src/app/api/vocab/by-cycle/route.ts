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

    // 1. Fetch all cycles for this user, ordered by cycle_number ascending
    const { data: cycles, error: cyclesErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .order('cycle_number', { ascending: true });
    
    let cyclesToProcess = cycles || [];
    let err = cyclesErr;
    
    if (cyclesErr) {
      console.warn('Querying with cycle_number failed, falling back to number:', cyclesErr.message);
      const fallbackRes = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', userId)
        .order('number', { ascending: true });
      cyclesToProcess = fallbackRes.data || [];
      err = fallbackRes.error;
    }

    if (err && cyclesToProcess.length === 0) {
      throw new Error(`Failed to fetch cycles: ${err.message}`);
    }

    const cycleComparisons: any[] = [];

    // Map cycle words for lookup
    const cycleWordsMap = new Map<string, string[]>(); // cycleId -> array of normalized words
    const allWords = await supabase
      .from('vocab_words')
      .select('cycle_id, normalized_word, frequency')
      .eq('user_id', userId)
      .gte('frequency', 2);

    if (allWords.data) {
      allWords.data.forEach(w => {
        const words = cycleWordsMap.get(w.cycle_id) || [];
        words.push(w.normalized_word);
        cycleWordsMap.set(w.cycle_id, words);
      });
    }

    for (let i = 0; i < cyclesToProcess.length; i++) {
      const cy = cyclesToProcess[i];
      const cycleWords = allWords.data?.filter(w => w.cycle_id === cy.id) || [];

      // Sort by frequency descending for most used
      const mostUsed = [...cycleWords]
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3)
        .map(w => ({ word: w.normalized_word, frequency: w.frequency }));

      // Count entries in this cycle
      const { count: entryCount } = await supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('cycle_id', cy.id);

      // Find new words (words first seen in this cycle)
      // Words that do not exist in any cycles with number < cy.number
      const prevCyclesIds = cyclesToProcess
        .slice(0, i)
        .map(c => c.id);
      
      const prevWordsSet = new Set<string>();
      prevCyclesIds.forEach(cid => {
        (cycleWordsMap.get(cid) || []).forEach(w => prevWordsSet.add(w));
      });

      const newWords = cycleWords
        .filter(w => !prevWordsSet.has(w.normalized_word))
        .map(w => w.normalized_word);

      // Find dropped words: words that were in the immediately preceding cycle (i-1) but not in this cycle
      let droppedWords: string[] = [];
      if (i > 0) {
        const prevCycleId = cyclesToProcess[i - 1].id;
        const prevCycleWords = cycleWordsMap.get(prevCycleId) || [];
        const currentWordsSet = new Set(cycleWords.map(w => w.normalized_word));
        droppedWords = prevCycleWords.filter(w => !currentWordsSet.has(w));
      }

      cycleComparisons.push({
        id: cy.id,
        number: cy.cycle_number !== undefined ? cy.cycle_number : cy.number,
        status: cy.status,
        started_at: cy.start_date || cy.started_at,
        ended_at: cy.end_date || cy.ended_at,
        entry_count: entryCount || 0,
        most_used: mostUsed,
        new_words: newWords,
        dropped_words: droppedWords
      });
    }

    // Return reversed so most recent cycle is first on frontend display
    return NextResponse.json({
      success: true,
      cycles: cycleComparisons.reverse()
    });

  } catch (error) {
    console.error('Vocab By-Cycle GET Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
