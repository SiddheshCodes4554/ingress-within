import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { supabase } from '../../../../lib/db';

/**
 * GET /api/knowledge/history: Retrieves the authenticated user's Knowledge Snapshots.
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

    const { data: snapshots, error } = await supabase
      .from('knowledge_snapshots')
      .select('*')
      .eq('user_id', authUser.userId)
      .order('week_number', { ascending: true });

    if (error) {
      console.error('[API Knowledge History] Database error:', error.message);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch knowledge history.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      history: snapshots || []
    });
  } catch (error: any) {
    console.error('[API Knowledge History GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
