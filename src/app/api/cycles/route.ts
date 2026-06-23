import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';
import { getAuthenticatedUser } from '../../../lib/auth-helper';

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

    // 1. Fetch all cycles, ordered by cycle_number descending
    const { data: cycles, error: cyclesErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .order('cycle_number', { ascending: false });

    let cyclesToProcess = cycles || [];

    if (cyclesErr) {
      console.warn('Querying with cycle_number failed, falling back to number:', cyclesErr.message);
      const fallbackRes = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', userId)
        .order('number', { ascending: false });
      
      if (fallbackRes.error) {
        throw new Error(`Failed to fetch cycles: ${fallbackRes.error.message}`);
      }
      
      cyclesToProcess = fallbackRes.data || [];
    }

    const cyclesWithDetails: any[] = [];

    // Fetch cycle vocab words to map vocab counts per cycle
    const { data: allVocab } = await supabase
      .from('vocab_words')
      .select('cycle_id, word')
      .eq('user_id', userId);

    for (const cy of cyclesToProcess) {
      // 2. Fetch entries for this cycle
      const { data: entries, error: entriesErr } = await supabase
        .from('entries')
        .select('*, reflections(*)')
        .eq('cycle_id', cy.id)
        .order('created_at', { ascending: false });

      if (entriesErr) {
        console.error(`Error fetching entries for cycle ${cy.id}:`, entriesErr.message);
      }

      // 3. Count weekly summaries
      const { count: summaryCount } = await supabase
        .from('weekly_summaries')
        .select('id', { count: 'exact', head: true })
        .eq('cycle_id', cy.id);

      // 4. Count threads / open reflection questions
      const { count: threadCount } = await supabase
        .from('reflections')
        .select('id', { count: 'exact', head: true })
        .eq('cycle_id', cy.id)
        .eq('status', 'ready');

      // 5. Count distinct vocabulary words in this cycle
      const cycleVocab = allVocab ? allVocab.filter((v: any) => v.cycle_id === cy.id) : [];
      const distinctWords = new Set(cycleVocab.map((v: any) => v.word.toLowerCase()));
      const vocabCount = distinctWords.size;

      // 6. Calculate progress percentage
      const activeDay = cy.current_day || 1;
      const progressPercentage = Math.round((activeDay / (cy.total_days || 30)) * 100);

      // Formatted entries list
      const formattedEntries = (entries || []).map((entry: any) => {
        const rawReflection = entry.reflections;
        const reflection = Array.isArray(rawReflection)
          ? (rawReflection[0] || null)
          : (rawReflection || null);

        let reflectionStatus = 'None';
        if (reflection) {
          if (reflection.status === 'completed') reflectionStatus = 'Completed';
          else if (reflection.status === 'ready') reflectionStatus = 'Pending Response';
          else reflectionStatus = reflection.status || 'Ready';
        }

        return {
          id: entry.id,
          content: entry.content,
          cycle_day: entry.cycle_day,
          entry_type: entry.entry_type || 'free_write',
          word_count: entry.word_count || 0,
          created_at: entry.created_at,
          reflectionStatus,
          reflectionText: reflection?.reflection_text || null,
          closingQuestion: reflection?.closing_question || null,
          reflectionAnswer: reflection?.reflection_answer || null
        };
      });

      cyclesWithDetails.push({
        id: cy.id,
        cycle_number: cy.cycle_number !== undefined ? cy.cycle_number : cy.number,
        status: cy.status,
        current_day: activeDay,
        total_days: cy.total_days || 30,
        progress_percentage: Math.min(100, progressPercentage),
        entries_count: formattedEntries.length,
        open_threads_count: threadCount || 0,
        weekly_summaries_count: summaryCount || 0,
        vocabulary_count: vocabCount,
        start_date: cy.start_date || cy.started_at,
        end_date: cy.end_date || cy.ended_at,
        assessment_completed: cy.assessment_completed,
        assessment_available: cy.assessment_available,
        entries: formattedEntries
      });
    }

    return NextResponse.json({
      success: true,
      cycles: cyclesWithDetails
    });

  } catch (error: any) {
    console.error('[API Cycles List] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
