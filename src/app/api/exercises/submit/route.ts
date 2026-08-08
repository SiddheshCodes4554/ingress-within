import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseRepository } from '../../../../lib/exercises/v4/repository/exerciseRepository';
import { ExerciseService } from '../../../../lib/exercises/v4/services/exerciseService';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { instance_id } = body;

    if (!instance_id) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Must provide instance_id.' } },
        { status: 400 }
      );
    }

    const instance = await ExerciseRepository.getInstance(instance_id);
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

    const submittedInstance = await ExerciseService.submitExercise(instance_id);

    // Trigger AI Analysis Worker based on exercise_id
    if (instance.exercise_id === 'relationship_map' || instance.exercise_id === 'exercise_5') {
      const { RelationshipMapWorker } = await import('../../../../lib/exercises/v4/workers/relationshipMapWorker');
      await RelationshipMapWorker.processInstance(instance_id, {
        relationship_map: body.relationship_map
      }).catch(err => {
        console.error(`[POST /api/exercises/submit] Relationship Map AI worker error for ${instance_id}:`, err);
      });
    } else if (instance.exercise_id === 'trigger_mapping') {
      const { TriggerMappingWorker } = await import('../../../../lib/exercises/v4/workers/triggerMappingWorker');
      await TriggerMappingWorker.processInstance(instance_id, {
        entry_answers: body.entry_answers,
        synthesis_answer: body.synthesis_answer
      }).catch(err => {
        console.error(`[POST /api/exercises/submit] Trigger Mapping AI worker error for ${instance_id}:`, err);
      });
    } else if (instance.exercise_id === 'body_signal_inventory' || instance.exercise_id === 'exercise_6') {
      const { BodySignalWorker } = await import('../../../../lib/exercises/v4/workers/bodySignalWorker');
      await BodySignalWorker.processInstance(instance_id, {
        raw_selections: body.raw_selections || body.system_signals,
        location_data: body.location_data,
        q1: body.q1,
        q2: body.q2,
        q3: body.q3
      }).catch(err => {
        console.error(`[POST /api/exercises/submit] Body Signal AI worker error for ${instance_id}:`, err);
      });
    } else if (instance.exercise_id === 'avoidance_audit' || instance.exercise_id === 'exercise_7') {
      const { AvoidanceAuditWorker } = await import('../../../../lib/exercises/v4/workers/avoidanceAuditWorker');
      await AvoidanceAuditWorker.processInstance(instance_id, {
        raw_completions: body.raw_completions || body.completions
      }).catch(err => {
        console.error(`[POST /api/exercises/submit] Avoidance Audit AI worker error for ${instance_id}:`, err);
      });
    } else if (instance.exercise_id === 'narrative_arc') {
      const { NarrativeArcWorker } = await import('../../../../lib/exercises/v4/workers/narrativeArcWorker');
      await NarrativeArcWorker.processInstance(instance_id, {
        q1: body.q1,
        q2: body.q2,
        q3: body.q3,
        q4: body.q4
      }).catch(err => {
        console.error(`[POST /api/exercises/submit] Narrative Arc AI worker error for ${instance_id}:`, err);
      });
    } else if (instance.exercise_id === 'core_values_card_sort' || instance.exercise_id === 'core_values' || instance.exercise_id === 'exercise_4') {
      const { CoreValuesAnalysisWorker } = await import('../../../../lib/exercises/v4/workers/coreValuesAnalysisWorker');
      await CoreValuesAnalysisWorker.processInstance(instance_id, {
        selected_values: body.selected_values,
        selection_order: body.selection_order,
        reorder_delta: body.reorder_delta
      }).catch(err => {
        console.error(`[POST /api/exercises/submit] Core Values AI worker error for ${instance_id}:`, err);
      });
    } else if (instance.exercise_id === 'exercise_3' || instance.exercise_id === 'self_perception') {
      const { Exercise3AnalysisWorker } = await import('../../../../lib/exercises/v4/workers/exercise3AnalysisWorker');
      await Exercise3AnalysisWorker.processInstance(instance_id).catch(err => {
        console.error(`[POST /api/exercises/submit] Exercise 3 AI worker error for ${instance_id}:`, err);
      });
    } else if (instance.exercise_id === 'exercise_2' || instance.exercise_id === 'inkblot_projective') {
      const { Exercise2AnalysisWorker } = await import('../../../../lib/exercises/v4/workers/exercise2AnalysisWorker');
      await Exercise2AnalysisWorker.processInstance(instance_id).catch(err => {
        console.error(`[POST /api/exercises/submit] Exercise 2 AI worker error for ${instance_id}:`, err);
      });
    } else if (instance.exercise_id === 'exercise_1') {
      const { Exercise1AnalysisWorker } = await import('../../../../lib/exercises/v4/workers/exercise1AnalysisWorker');
      await Exercise1AnalysisWorker.processInstance(instance_id).catch(err => {
        console.error(`[POST /api/exercises/submit] Exercise 1 AI worker error for ${instance_id}:`, err);
      });
    } else {
      const { ExerciseAnalysisWorker } = await import('../../../../lib/exercises/v4/workers/exerciseAnalysisWorker');
      await ExerciseAnalysisWorker.processInstance(instance_id).catch(err => {
        console.error(`[POST /api/exercises/submit] Exercise 0 AI worker error for ${instance_id}:`, err);
      });
    }

    return NextResponse.json({ success: true, instance: submittedInstance });
  } catch (error: any) {
    console.error('[POST /api/exercises/submit] Error:', error);
    return NextResponse.json(
      { error: { code: 'SUBMIT_FAILED', message: error.message || 'Failed to submit exercise.' } },
      { status: 400 }
    );
  }
}
