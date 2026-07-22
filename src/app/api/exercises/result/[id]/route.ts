import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/db';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET: Fetches AI result analysis for a finished exercise instance.
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

    const { id: instanceId } = await context.params;

    const { data: result, error } = await supabase
      .from('exercise_results')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result
    });
  } catch (err: any) {
    console.error('[API exercise result] Error:', err.message);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
