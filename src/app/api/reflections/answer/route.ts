import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

/**
 * POST /api/reflections/answer: Submits or autosaves a response to a reflection question.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { reflectionId, answer, status } = body;

    if (!reflectionId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing reflection ID.' } },
        { status: 400 }
      );
    }

    // 1. Confirm reflection exists and belongs to user
    const { data: reflection, error: reflectionError } = await supabase
      .from('reflections')
      .select('*')
      .eq('id', reflectionId)
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (reflectionError) {
      console.error('Failed to query reflection details:', reflectionError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to query reflection details.' } },
        { status: 500 }
      );
    }

    if (!reflection) {
      return NextResponse.json(
        { error: { code: 'REFLECTION_NOT_FOUND', message: 'The requested reflection does not exist.' } },
        { status: 404 }
      );
    }

    // 2. Prepare update data
    const updateData: any = {
      reflection_answer: answer ? answer.trim() : ''
    };

    if (status === 'completed' || !status) {
      updateData.status = 'completed';
      updateData.answered_at = new Date().toISOString();
    } else if (status === 'ready') {
      updateData.status = 'ready';
    } else {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Invalid status. Must be ready or completed.' } },
        { status: 400 }
      );
    }

    // 3. Update the reflection in the database
    const { data: updatedReflection, error: updateError } = await supabase
      .from('reflections')
      .update(updateData)
      .eq('id', reflectionId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update reflection:', updateError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to update reflection.' } },
        { status: 500 }
      );
    }

    // 4. Update the corresponding thread status to match
    if (status === 'completed' || !status) {
      const { error: threadUpdateErr } = await supabase
        .from('threads')
        .update({
          status: 'Answered',
          answered_at: new Date().toISOString(),
          draft_response: null
        })
        .eq('reflection_id', reflectionId);
        
      if (threadUpdateErr) {
        console.warn('Failed to update corresponding thread to Answered:', threadUpdateErr);
      }
    } else if (status === 'ready') {
      const { error: threadUpdateErr } = await supabase
        .from('threads')
        .update({
          draft_response: answer ? answer.trim() : ''
        })
        .eq('reflection_id', reflectionId);
        
      if (threadUpdateErr) {
        console.warn('Failed to update corresponding thread draft:', threadUpdateErr);
      }
    }

    return NextResponse.json({
      success: true,
      reflection: updatedReflection
    });

  } catch (error) {
    console.error('Reflection answer route POST Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
