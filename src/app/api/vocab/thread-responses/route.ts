import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

/**
 * GET /api/vocab/thread-responses: Returns all completed thread responses for the user vocab feed.
 */
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

    // 1. Fetch thread responses, joining threads, cycles, reflections, and entries
    const { data: responses, error: responsesErr } = await supabase
      .from('thread_responses')
      .select(`
        id,
        response_text,
        created_at,
        threads (
          closing_question,
          cycle_id,
          cycles (
            cycle_number
          ),
          reflections (
            entries (
              cycle_day
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (responsesErr) {
      console.error('Failed to fetch thread responses for vocab:', responsesErr);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve responses.' } },
        { status: 500 }
      );
    }

    const threadResponses: any[] = [];

    for (const r of (responses || [])) {
      const thread = r.threads as any;
      if (!thread) continue;

      const cycleNum = thread.cycles?.cycle_number || 1;
      const cycleDay = thread.reflections?.entries?.cycle_day || 1;
      
      const fullText = r.response_text || '';
      const preview = fullText.length > 80 ? `${fullText.substring(0, 80)}...` : fullText;
      const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;

      // Format date
      const dateWritten = new Date(r.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short'
      });

      threadResponses.push({
        id: r.id,
        from: `Open thread · Day ${cycleDay} reflection · Cycle ${cycleNum}`,
        question: thread.closing_question,
        preview: `"${preview}"`,
        full: `"${fullText}"`,
        meta: `Written ${dateWritten} · ${wordCount} words`,
        footer: `Saved · fed into Cycle ${cycleNum} Day 28 report`
      });
    }

    // 2. Fetch count of active open threads
    const { count: openThreadsCount } = await supabase
      .from('threads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'Open');

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
