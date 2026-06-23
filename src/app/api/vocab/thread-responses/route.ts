import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { decrypt } from '../../../../lib/encryption';

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

    // 1. Fetch entries that are thread responses and have open_thread_id
    const { data: entries, error: entriesErr } = await supabase
      .from('entries')
      .select('id, content, new_entry_text_encrypted, new_entry_text_iv, word_count, written_at, open_thread_id, cycle_id')
      .eq('user_id', userId)
      .eq('thread_response', true)
      .not('open_thread_id', 'is', null)
      .order('written_at', { ascending: false });

    if (entriesErr) {
      throw new Error(`Failed to fetch entries: ${entriesErr.message}`);
    }

    const threadResponses: any[] = [];

    for (const entry of (entries || [])) {
      // Fetch open thread details
      const { data: openThread, error: otErr } = await supabase
        .from('open_threads')
        .select('question, cycle_id, source_summary_id')
        .eq('id', entry.open_thread_id)
        .maybeSingle();

      if (otErr || !openThread) continue;

      // Decrypt response text
      const fullText = decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv) || entry.content || '';
      const preview = fullText.length > 80 ? `${fullText.substring(0, 80)}...` : fullText;

      // Find cycle number
      const { data: cycle } = await supabase
        .from('cycles')
        .select('cycle_number')
        .eq('id', entry.cycle_id)
        .maybeSingle();

      const cycleNum = cycle ? cycle.cycle_number : 1;

      // Find week number from weekly summary if it has source_summary_id
      let weekNum = 1;
      if (openThread.source_summary_id) {
        const { data: summary } = await supabase
          .from('weekly_summaries')
          .select('week_number')
          .eq('id', openThread.source_summary_id)
          .maybeSingle();
        weekNum = summary?.week_number || 1;
      }

      // Format date
      const dateWritten = new Date(entry.written_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short'
      });

      threadResponses.push({
        id: entry.id,
        from: `Open thread · Week ${weekNum} summary · Cycle ${cycleNum}`,
        question: openThread.question,
        preview: `"${preview}"`,
        full: `"${fullText}"`,
        meta: `Written ${dateWritten} · ${entry.word_count} words`,
        footer: `Saved · fed into Cycle ${cycleNum} Day 28 report`
      });
    }

    // 2. Fetch count of active open threads
    const { count: openThreadsCount } = await supabase
      .from('open_threads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'open');

    return NextResponse.json({
      success: true,
      responses: threadResponses,
      openThreadsCount: openThreadsCount || 0
    });

  } catch (error) {
    console.error('Vocab Thread Responses GET Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
