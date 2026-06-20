import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';
import { getAuthenticatedUser } from '../../../lib/auth-helper';

/**
 * GET /api/threads: Returns all active threads for the user.
 * Auto-seeds the prototype default threads if the user has no threads in the database yet.
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

    // 1. Query threads from open_threads table
    let { data: threads, error } = await supabase
      .from('open_threads')
      .select('*')
      .eq('user_id', authUser.userId)
      .neq('status', 'closed')
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
      source_summary_id: t.source_summary_id,
      question: t.question,
      origin: t.origin_context || 'Self-Reflection',
      status: t.status === 'open' ? 'NEW' : t.status.toUpperCase(),
      created_at: t.created_at,
      addressed_at: t.addressed_at,
      addressed_entry_id: t.addressed_entry_id
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
