import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { decrypt } from '../../../../lib/encryption';

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/threads/[id]: Fetches thread details, decrypted parent entry, and response history.
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

    // Fetch thread, joining reflections and entries
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select(`
        *,
        reflections (
          id,
          reflection_text,
          entry_id,
          entries (
            id,
            content,
            new_entry_text_encrypted,
            new_entry_text_iv,
            written_at,
            cycle_day
          )
        ),
        cycles (
          cycle_number
        )
      `)
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

    // Decrypt the original journal entry text
    const parentEntry = thread.reflections?.entries;
    let originalEntryText = '';
    if (parentEntry) {
      originalEntryText = decrypt(parentEntry.new_entry_text_encrypted, parentEntry.new_entry_text_iv) || parentEntry.content || '';
    }

    // Map thread details for frontend
    const mappedThread = {
      id: thread.id,
      user_id: thread.user_id,
      cycle_id: thread.cycle_id,
      cycle_number: thread.cycles?.cycle_number || 1,
      reflection_id: thread.reflection_id,
      reflection_text: thread.reflections?.reflection_text || '',
      closing_question: thread.closing_question,
      status: thread.status,
      draft_response: thread.draft_response || '',
      created_at: thread.created_at,
      answered_at: thread.answered_at,
      original_entry: parentEntry ? {
        id: parentEntry.id,
        content: originalEntryText,
        written_at: parentEntry.written_at,
        cycle_day: parentEntry.cycle_day
      } : null
    };

    // Fetch previous responses for this thread
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

    const mappedResponses = (responses || []).map((r: any) => ({
      id: r.id,
      thread_id: r.thread_id,
      user_id: r.user_id,
      response: r.response_text,
      response_text: r.response_text,
      created_at: r.created_at,
      used_for_scoring: r.used_for_scoring
    }));

    return NextResponse.json({
      success: true,
      thread: mappedThread,
      responses: mappedResponses
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
      .from('threads')
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

    // 2. Automatically set used_for_scoring = false for all previous thread responses of the user
    const { error: updateOldResponsesError } = await supabase
      .from('thread_responses')
      .update({ used_for_scoring: false })
      .eq('user_id', authUser.userId);

    if (updateOldResponsesError) {
      console.error('Failed to disable older responses for scoring:', updateOldResponsesError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to update scoring flags.' } },
        { status: 500 }
      );
    }

    // 3. Insert new response with used_for_scoring = true
    const { data: newResponse, error: responseError } = await supabase
      .from('thread_responses')
      .insert({
        thread_id: threadId,
        user_id: authUser.userId,
        response_text: response.trim(),
        used_for_scoring: true
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

    // 4. Update thread status to 'Answered' and set answered_at = NOW() and clear draft_response
    const { error: updateThreadError } = await supabase
      .from('threads')
      .update({
        status: 'Answered',
        answered_at: new Date().toISOString(),
        draft_response: null
      })
      .eq('id', threadId);

    if (updateThreadError) {
      console.warn('Failed to transition thread status to Answered:', updateThreadError);
    }

    // 5. Update corresponding reflection status to 'completed'
    if (thread.reflection_id) {
      const { error: updateReflectionError } = await supabase
        .from('reflections')
        .update({
          status: 'completed',
          reflection_answer: response.trim(),
          answered_at: new Date().toISOString()
        })
        .eq('id', thread.reflection_id);

      if (updateReflectionError) {
        console.error('Failed to update corresponding reflection status:', updateReflectionError);
      }
    }

    return NextResponse.json({
      success: true,
      response: {
        id: newResponse.id,
        thread_id: newResponse.thread_id,
        user_id: newResponse.user_id,
        response: newResponse.response_text,
        response_text: newResponse.response_text,
        created_at: newResponse.created_at,
        used_for_scoring: newResponse.used_for_scoring
      }
    });

  } catch (error) {
    console.error('Thread response POST Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/threads/[id]: Saves a draft response to the thread.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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
    const { draft } = body;

    // 1. Confirm thread exists and belongs to user
    const { data: thread, error: threadError } = await supabase
      .from('threads')
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

    // 2. Update draft_response
    const { data: updatedThread, error: updateError } = await supabase
      .from('threads')
      .update({ draft_response: draft !== undefined ? draft : '' })
      .eq('id', threadId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to save thread draft:', updateError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to save draft.' } },
        { status: 500 }
      );
    }

    // 3. Update corresponding reflection's reflection_answer
    if (thread.reflection_id) {
      const { error: reflectionUpdateErr } = await supabase
        .from('reflections')
        .update({
          reflection_answer: draft !== undefined ? draft.trim() : ''
        })
        .eq('id', thread.reflection_id);
        
      if (reflectionUpdateErr) {
        console.warn('Failed to update corresponding reflection draft:', reflectionUpdateErr);
      }
    }

    return NextResponse.json({
      success: true,
      draft_response: updatedThread.draft_response
    });

  } catch (error) {
    console.error('Thread draft PATCH Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
