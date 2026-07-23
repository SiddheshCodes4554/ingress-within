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

    const { id: rawId } = await context.params;

    let targetInstanceId = rawId;

    // If rawId is an exercise_id (e.g. exercise_1), resolve instance_id from active cycle
    if (rawId.startsWith('exercise_') || rawId.startsWith('cbt_')) {
      const { data: inst } = await supabase
        .from('exercise_instances')
        .select('id')
        .eq('user_id', authUser.userId)
        .eq('exercise_id', rawId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (inst) {
        targetInstanceId = inst.id;
      }
    }

    let { data: result, error } = await supabase
      .from('exercise_results')
      .select('*')
      .eq('instance_id', targetInstanceId)
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (!result && targetInstanceId !== rawId) {
      // Fallback query directly by rawId as instance_id
      const { data: altResult } = await supabase
        .from('exercise_results')
        .select('*')
        .eq('instance_id', rawId)
        .eq('user_id', authUser.userId)
        .maybeSingle();
      if (altResult) result = altResult;
    }

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
