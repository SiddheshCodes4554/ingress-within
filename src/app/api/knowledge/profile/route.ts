import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { supabase } from '../../../../lib/db';

/**
 * GET /api/knowledge/profile: Retrieves the authenticated user's Knowledge Profile.
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

    const { data: profile, error } = await supabase
      .from('knowledge_profile')
      .select('*')
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (error) {
      console.error('[API Knowledge Profile] Database error:', error.message);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to fetch knowledge profile.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: profile || null
    });
  } catch (error: any) {
    console.error('[API Knowledge Profile GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
