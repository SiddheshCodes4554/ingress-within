import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

/**
 * GET: Fetches history of finished/completed/archived exercises.
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

    const { data: history, error } = await supabase
      .from('exercise_instances')
      .select('*, definition:exercise_definitions(*), results:exercise_results(*)')
      .eq('user_id', authUser.userId)
      .in('status', ['finished', 'completed', 'archived'])
      .order('completion_time', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      history
    });
  } catch (err: any) {
    console.error('[API exercise history] Error:', err.message);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
