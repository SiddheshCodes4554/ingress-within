import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';
import { getAuthenticatedUser } from '../../../lib/auth-helper';

/**
 * GET /api/patterns: Fetches all patterns and their cycle states for the user.
 * Performs a version-aware background rebuild check.
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

    // 1. Fetch patterns and cycle states from database
    const { data: patterns, error: patternsErr } = await supabase
      .from('patterns')
      .select('*, pattern_cycle_states(*)')
      .eq('user_id', userId);

    if (patternsErr) {
      throw new Error(`Failed to fetch patterns: ${patternsErr.message}`);
    }

    return NextResponse.json({
      success: true,
      patterns: patterns || []
    });

  } catch (error: any) {
    console.error('[API Patterns GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
