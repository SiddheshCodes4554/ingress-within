import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

/**
 * GET /api/reports/assessment: Fetches the Day 28 assessment report for a specific cycle.
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
    const cycleId = request.nextUrl.searchParams.get('cycleId');

    if (!cycleId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing cycle ID.' } },
        { status: 400 }
      );
    }

    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch cycle assessment: ${error.message}`);
    }

    // Version check and rebuild scheduling
    const { data: userVersions } = await supabase
      .from('user_intelligence_versions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const currentEngine = '1.0';
    const currentPrompt = '1.0';

    const versionMismatch = !userVersions || 
      userVersions.assessment_engine_version !== currentEngine || 
      userVersions.assessment_prompt_version !== currentPrompt;

    if (versionMismatch) {
      console.log(`[Assessment API] Rebuild needed. Scheduling async rebuild...`);
      const { queueRegistry } = await import('../../../../lib/queue/registry');
      await queueRegistry.addJob(
        'intelligence_rebuild',
        `rebuild_assessment_${userId}`,
        { user_id: userId, subsystem: 'assessment' },
        `rebuild_assessment_${userId}`
      );
    }

    return NextResponse.json({
      success: true,
      assessment
    });

  } catch (error: any) {
    console.error('[API Assessment GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
