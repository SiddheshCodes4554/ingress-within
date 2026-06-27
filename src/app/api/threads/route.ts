import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';
import { getAuthenticatedUser } from '../../../lib/auth-helper';

/**
 * GET /api/threads: Returns all threads for the user, latest first.
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

    // Query threads from new threads table, joining reflection and cycle info
    const { data: threads, error } = await supabase
      .from('threads')
      .select(`
        *,
        reflections (
          reflection_text
        ),
        cycles (
          cycle_number
        )
      `)
      .eq('user_id', authUser.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch threads:', error);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve threads.' } },
        { status: 500 }
      );
    }

    // Map fields for frontend compatibility
    const mappedThreads = (threads || []).map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      cycle_id: t.cycle_id,
      cycle_number: t.cycles?.cycle_number || 1,
      reflection_id: t.reflection_id,
      reflection_text: t.reflections?.reflection_text || '',
      closing_question: t.closing_question,
      status: t.status, // 'Open', 'Answered', 'Archived'
      draft_response: t.draft_response || '',
      created_at: t.created_at,
      answered_at: t.answered_at
    }));

    return NextResponse.json({
      success: true,
      threads: mappedThreads
    });

  } catch (error) {
    console.error('Threads GET Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
