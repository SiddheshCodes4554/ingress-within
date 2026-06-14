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

    // 1. Query threads
    let { data: threads, error } = await supabase
      .from('threads')
      .select('*')
      .eq('user_id', authUser.userId)
      .neq('status', 'CLOSED')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch threads:', error);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve threads.' } },
        { status: 500 }
      );
    }



    return NextResponse.json({
      success: true,
      threads: threads || []
    });

  } catch (error) {
    console.error('Threads GET Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
