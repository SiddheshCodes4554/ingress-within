import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/threads/[id]: Fetches thread details and its response history.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const { id: threadId } = await context.params;

    // 1. Fetch thread details from open_threads table
    const { data: thread, error: threadError } = await supabase
      .from('open_threads')
      .select('*')
      .eq('id', threadId)
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (threadError) {
      console.error('Failed to query thread details:', threadError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to query thread details.' } },
        { status: 500 }
      );
    }

    if (!thread) {
      return NextResponse.json(
        { error: { code: 'THREAD_NOT_FOUND', message: 'The requested reflection thread does not exist.' } },
        { status: 404 }
      );
    }

    // Map fields for frontend compatibility
    const mappedThread = {
      id: thread.id,
      user_id: thread.user_id,
      cycle_id: thread.cycle_id,
      source_summary_id: thread.source_summary_id,
      question: thread.question,
      origin: thread.origin_context || 'Self-Reflection',
      status: thread.status === 'open' ? 'NEW' : thread.status.toUpperCase(),
      created_at: thread.created_at,
      addressed_at: thread.addressed_at,
      addressed_entry_id: thread.addressed_entry_id
    };

    // 2. Fetch previous responses for this thread
    const { data: responses, error: responsesError } = await supabase
      .from('thread_responses')
      .select('*')
      .eq('thread_id', threadId)
      .eq('user_id', authUser.userId)
      .order('created_at', { ascending: true });

    if (responsesError) {
      console.error('Failed to query thread responses:', responsesError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to query reflection history.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      thread: mappedThread,
      responses: responses || []
    });

  } catch (error) {
    console.error('Thread details GET Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/threads/[id]: Appends a new response/reflection to the thread.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const { id: threadId } = await context.params;

    const body = await request.json().catch(() => ({}));
    const { response } = body;

    if (!response || !response.trim()) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Reflection response content cannot be empty.' } },
        { status: 400 }
      );
    }

    // 1. Confirm thread exists and belongs to user
    const { data: thread, error: threadError } = await supabase
      .from('open_threads')
      .select('*')
      .eq('id', threadId)
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: { code: 'THREAD_NOT_FOUND', message: 'Reflection thread not found.' } },
        { status: 404 }
      );
    }

    // 2. Insert new thread response
    const { data: newResponse, error: responseError } = await supabase
      .from('thread_responses')
      .insert({
        thread_id: threadId,
        user_id: authUser.userId,
        response: response.trim()
      })
      .select()
      .single();

    if (responseError) {
      console.error('Failed to log thread response:', responseError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to record reflection response.' } },
        { status: 500 }
      );
    }

    // 3. Update thread status (transition open/NEW or RETURNED to active/ACTIVE)
    if (thread.status === 'open' || thread.status === 'NEW' || thread.status === 'RETURNED') {
      const { error: updateError } = await supabase
        .from('open_threads')
        .update({ status: 'active' })
        .eq('id', threadId);

      if (updateError) {
        console.warn('Failed to transition thread status to active:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      response: newResponse
    });

  } catch (error) {
    console.error('Thread response POST Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
