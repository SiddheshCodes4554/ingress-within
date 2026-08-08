import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseRepository } from '../../../../lib/exercises/v4/repository/exerciseRepository';
import { ExerciseResultService } from '../../../../lib/exercises/v4/services/exerciseResultService';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const instanceId = request.nextUrl.searchParams.get('instance_id');
    if (!instanceId) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Must provide instance_id.' } },
        { status: 400 }
      );
    }

    const instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Exercise instance not found.' } },
        { status: 404 }
      );
    }

    if (instance.user_id !== authUser.userId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied.' } },
        { status: 403 }
      );
    }

    const retry = request.nextUrl.searchParams.get('retry') === 'true';
    let result = await ExerciseResultService.getResult(instanceId);

    if (retry && result) {
      const analysis = result.analysis || result.data || {};
      const isFallback = !analysis.reflection_text || (result.summary && result.summary.includes('recorded below'));

      if (isFallback) {
        try {
          if (instance.exercise_id === 'relationship_map' || instance.exercise_id === 'exercise_5') {
            const { RelationshipMapWorker } = await import('../../../../lib/exercises/v4/workers/relationshipMapWorker');
            result = await RelationshipMapWorker.processInstance(instanceId);
          } else if (instance.exercise_id === 'avoidance_audit' || instance.exercise_id === 'exercise_7') {
            const { AvoidanceAuditWorker } = await import('../../../../lib/exercises/v4/workers/avoidanceAuditWorker');
            result = await AvoidanceAuditWorker.processInstance(instanceId);
          } else if (instance.exercise_id === 'trigger_mapping') {
            const { TriggerMappingWorker } = await import('../../../../lib/exercises/v4/workers/triggerMappingWorker');
            result = await TriggerMappingWorker.processInstance(instanceId);
          } else if (instance.exercise_id === 'body_signal_inventory' || instance.exercise_id === 'exercise_6') {
            const { BodySignalWorker } = await import('../../../../lib/exercises/v4/workers/bodySignalWorker');
            result = await BodySignalWorker.processInstance(instanceId);
          } else if (instance.exercise_id === 'narrative_arc') {
            const { NarrativeArcWorker } = await import('../../../../lib/exercises/v4/workers/narrativeArcWorker');
            result = await NarrativeArcWorker.processInstance(instanceId);
          }
        } catch (retryErr) {
          console.warn('[GET /api/exercises/result] Retry worker failed:', retryErr);
        }
      }
    }

    return NextResponse.json({ success: true, result, instance });
  } catch (error: any) {
    console.error('[GET /api/exercises/result] Error:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: error.message || 'Internal error.' } },
      { status: 500 }
    );
  }
}
