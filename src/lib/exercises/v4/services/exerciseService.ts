import { ExerciseRepository } from '../repository/exerciseRepository';
import { ExerciseLifecycleService } from './exerciseLifecycleService';
import { ExerciseValidator } from '../validation/exerciseValidator';
import { Exercise1AnalysisWorker } from '../workers/exercise1AnalysisWorker';
import {
  ExerciseDefinition,
  ExerciseInstance,
  ExerciseResponse,
  ExerciseResult,
  ExerciseLifecycleStatus
} from '../types/exercise.types';
import { supabase } from '../../../db';

export class ExerciseService {
  /**
   * Upserts an exercise definition into the database.
   */
  public static async registerDefinition(def: ExerciseDefinition): Promise<ExerciseDefinition> {
    ExerciseValidator.validateDefinition(def);
    return await ExerciseRepository.upsertDefinition(def);
  }

  /**
   * Initializes an exercise instance for a user. Defaults to status 'locked' or 'available'.
   */
  public static async createInstance(
    userId: string,
    exerciseId: string,
    cycleId?: string,
    initialStatus: ExerciseLifecycleStatus = 'locked'
  ): Promise<ExerciseInstance> {
    const existing = await ExerciseRepository.getInstanceByUserAndExercise(userId, cycleId, exerciseId);
    if (existing && ['locked', 'available', 'started', 'in_progress', 'submitted', 'processing'].includes(existing.status)) {
      return existing;
    }

    return await ExerciseRepository.createInstance({
      user_id: userId,
      cycle_id: cycleId,
      exercise_id: exerciseId,
      status: initialStatus,
      unlock_time: initialStatus === 'available' ? new Date().toISOString() : null
    });
  }

  /**
   * Prepares Exercise 1 word sequence via Call 1 if not already stored in instance events.
   */
  public static async prepareExercise1Sequence(instanceId: string): Promise<{ instance: ExerciseInstance; sequence: any[] }> {
    const instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    // Check existing sequence_created event
    const { data: existingEvents } = await supabase
      .from('exercise_events')
      .select('payload')
      .eq('instance_id', instanceId)
      .eq('event_type', 'sequence_created')
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingEvents && existingEvents.length > 0 && existingEvents[0].payload?.word_sequence) {
      return { instance, sequence: existingEvents[0].payload.word_sequence };
    }

    // Call 1 word selection
    const { words, sequence } = await Exercise1AnalysisWorker.runCall1(instance.user_id);

    // Save event to exercise_events table
    await supabase.from('exercise_events').insert({
      instance_id: instanceId,
      user_id: instance.user_id,
      event_type: 'sequence_created',
      payload: { word_sequence: sequence, personalised_words: words }
    });

    return { instance, sequence };
  }

  /**
   * Transitions an available exercise instance to 'started'. Auto-unlocks locked instances first.
   */
  public static async startExercise(instanceId: string): Promise<ExerciseInstance> {
    let instance = await ExerciseRepository.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`);
    }

    // Auto-heal lifecycle: transition locked instances to available first
    if (instance.status === 'locked') {
      instance = await ExerciseLifecycleService.transitionTo(instanceId, 'available');
    }

    if (instance.status === 'started' || instance.status === 'in_progress') {
      return instance;
    }

    return await ExerciseLifecycleService.transitionTo(instanceId, 'started');
  }

  /**
   * Saves a user response to a question and transitions status to 'in_progress' if in 'started' state.
   */
  public static async saveResponse(response: ExerciseResponse): Promise<{ response: ExerciseResponse; instance: ExerciseInstance }> {
    ExerciseValidator.validateResponse(response);
    const savedResponse = await ExerciseRepository.saveResponse(response);

    let instance = await ExerciseRepository.getInstance(response.instance_id);
    if (!instance) {
      throw new Error(`[ExerciseService] Instance not found: ${response.instance_id}`);
    }

    if (instance.status === 'started') {
      instance = await ExerciseLifecycleService.transitionTo(response.instance_id, 'in_progress');
    }

    return { response: savedResponse, instance };
  }

  /**
   * Submits an exercise instance (transitions from 'started' or 'in_progress' to 'submitted').
   */
  public static async submitExercise(instanceId: string): Promise<ExerciseInstance> {
    return await ExerciseLifecycleService.transitionTo(instanceId, 'submitted');
  }

  /**
   * Transitions instance from 'submitted' to 'processing'.
   */
  public static async setProcessing(instanceId: string): Promise<ExerciseInstance> {
    return await ExerciseLifecycleService.transitionTo(instanceId, 'processing');
  }

  /**
   * Saves result and transitions instance from 'processing' to 'completed'.
   */
  public static async completeExercise(result: ExerciseResult): Promise<{ result: ExerciseResult; instance: ExerciseInstance }> {
    ExerciseValidator.validateResult(result);
    const savedResult = await ExerciseRepository.saveResult({
      instance_id: result.instance_id,
      user_id: result.user_id,
      summary: result.summary || '',
      analysis: result.data || result.analysis,
      score: result.score
    });
    const instance = await ExerciseLifecycleService.transitionTo(result.instance_id, 'completed');
    return { result: savedResult, instance };
  }

  /**
   * Fetches stored immutable result for an instance.
   */
  public static async getResult(instanceId: string): Promise<ExerciseResult | null> {
    return await ExerciseRepository.getResultForInstance(instanceId);
  }
}
