import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/db';
import { getAuthenticatedUser } from '../../../../../lib/auth-helper';

type RouteContext = {
  params: Promise<{ instanceId: string }>
};

/**
 * GET /api/admin/exercise-debug/[instanceId]
 * Diagnostic observability endpoint returning full execution lifecycle state.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { instanceId } = await context.params;

    // 1. Query exercise instance
    const { data: instance, error: instErr } = await supabase
      .from('exercise_instances')
      .select('*, definition:exercise_definitions(*)')
      .eq('id', instanceId)
      .maybeSingle();

    if (!instance) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Exercise instance "${instanceId}" not found.` } },
        { status: 404 }
      );
    }

    // 2. Query exercise responses
    const { data: responses } = await supabase
      .from('exercise_responses')
      .select('id, question_id, step_id, response, created_at')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: true });

    // 3. Query exercise results
    const { data: results } = await supabase
      .from('exercise_results')
      .select('*')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: false });

    // 4. Query exercise events log
    const { data: events } = await supabase
      .from('exercise_events')
      .select('*')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: false });

    // 5. Query orchestrator job
    const { data: jobs } = await supabase
      .from('orchestrator_jobs')
      .select('*')
      .eq('user_id', instance.user_id)
      .like('trigger', `%${instanceId}%`)
      .order('queued_at', { ascending: false });

    const latestResult = results && results.length > 0 ? results[0] : null;

    return NextResponse.json({
      success: true,
      debug: {
        instanceId,
        exerciseId: instance.exercise_id,
        userId: instance.user_id,
        cycleId: instance.cycle_id,
        currentStatus: instance.status,
        flags: {
          locked: instance.locked,
          available: instance.available,
          started: instance.started,
          completed: instance.completed,
          expired: instance.expired
        },
        timestamps: {
          unlock_time: instance.unlock_time,
          start_time: instance.start_time,
          completion_time: instance.completion_time,
          updated_at: instance.updated_at
        },
        responsesCount: responses?.length || 0,
        hasResults: !!latestResult,
        resultSummary: latestResult?.summary || null,
        aiProvider: latestResult?.provider || instance.definition?.provider_version || 'gemini',
        promptVersion: latestResult?.prompt_version || instance.definition?.prompt_version || 'v1',
        lastEvent: events && events.length > 0 ? events[0] : null,
        orchestratorJob: jobs && jobs.length > 0 ? jobs[0] : null,
        history: {
          events: events || [],
          results: results || []
        }
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
