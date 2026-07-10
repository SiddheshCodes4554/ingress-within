import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { supabase } from '../../../../lib/db';

/**
 * GET /api/knowledge/relationships: Retrieves the authenticated user's Knowledge Relationships.
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

    const { data: relationships, error } = await supabase
      .from('knowledge_relationships')
      .select('*')
      .eq('user_id', authUser.userId)
      .order('strength', { ascending: false });

    if (error) {
      console.error('[API Knowledge Relationships] Database error:', error.message);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch knowledge relationships.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      relationships: relationships || []
    });
  } catch (error: any) {
    console.error('[API Knowledge Relationships GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
