import { supabase } from '../db';
import { ExerciseLifecycleManager } from './exerciseLifecycleManager';
import { ExerciseEventPublisher } from './exerciseEventPublisher';

export class ExerciseProgressService {
  /**
   * Autosaves a step response or draft screen state.
   * If instance state is 'started', transitions to 'in_progress' to represent active progression.
   */
  public static async saveProgress(
    userId: string,
    instanceId: string,
    questionId: string,
    stepId: string,
    response: any,
    metadata: any = {}
  ): Promise<void> {
    console.log(`[ProgressService] Saving step ${questionId} (step: ${stepId}) for instance ${instanceId}`);

    // 1. Fetch current instance status
    const { data: instance, error: fetchErr } = await supabase
      .from('exercise_instances')
      .select('status, cycle_id, exercise_id')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !instance) {
      throw new Error('Exercise instance not found or unauthorized.');
    }

    const currentStatus = instance.status;

    // Reject saving progress if completed, finished, or archived
    const terminalStates = ['completed', 'queued', 'analysing', 'finished', 'archived'];
    if (terminalStates.includes(currentStatus)) {
      throw new Error(`Cannot save progress when exercise is in a terminal state: ${currentStatus}`);
    }

    // 2. State transition: started -> in_progress
    if (currentStatus === 'started' || currentStatus === 'available') {
      await ExerciseLifecycleManager.transitionTo(userId, instanceId, 'in_progress', {
        transitionReason: 'User generated first draft answer response.'
      });
    }

    // 3. Upsert responses into exercise_responses
    const { error: upsertErr } = await supabase
      .from('exercise_responses')
      .upsert({
        instance_id: instanceId,
        user_id: userId,
        question_id: questionId,
        step_id: stepId,
        response,
        metadata,
        created_at: new Date().toISOString()
      }, { onConflict: 'instance_id,question_id' });

    if (upsertErr) {
      throw new Error(`Progress autosave failed: ${upsertErr.message}`);
    }

    // Update instance updated_at timestamp
    await supabase
      .from('exercise_instances')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', instanceId);

    // 4. Emit progress event
    await ExerciseEventPublisher.publishProgress(userId, {
      instance_id: instanceId,
      exercise_id: instance.exercise_id,
      cycle_id: instance.cycle_id,
      question_id: questionId,
      step_id: stepId
    });
  }

  /**
   * Resumes an exercise, returning all current response drafts and the saved screen state index.
   * If instance is in 'available', transitions it to 'started' state.
   */
  public static async resumeExercise(
    userId: string,
    instanceId: string
  ): Promise<{ instance: any; responses: any[]; screenState: any | null; stimulusList?: string[] | null }> {
    console.log(`[ProgressService] Resuming instance ${instanceId}`);

    // 1. Fetch current instance
    const { data: instance, error: fetchErr } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !instance) {
      throw new Error('Exercise instance not found or unauthorized.');
    }

    let activeInstance = instance;

    // 2. Handle state transitions if resuming from available status
    if (instance.status === 'available') {
      activeInstance = await ExerciseLifecycleManager.transitionTo(userId, instanceId, 'started', {
        transitionReason: 'User initiated resume from available state.'
      });
    }

    // 3. Fetch existing response drafts
    const { data: responses, error: respErr } = await supabase
      .from('exercise_responses')
      .select('*')
      .eq('instance_id', instanceId);

    if (respErr) {
      throw new Error(`Failed to restore responses: ${respErr.message}`);
    }

    const responsesList = responses || [];
    let stimulusList: string[] | null = null;

    if (instance.exercise_id === 'exercise_1') {
      const stimulusRecord = responsesList.find(r => r.question_id === '__stimulus_list');
      if (stimulusRecord) {
        stimulusList = stimulusRecord.response as string[];
      } else {
        const { WordAssociationGenerator } = await import('./wordAssociationGenerator');
        const generated = await WordAssociationGenerator.generate(userId);
        
        await supabase.from('exercise_responses').upsert({
          instance_id: instanceId,
          user_id: userId,
          question_id: '__stimulus_list',
          step_id: '__stimulus_list',
          response: generated.sequence,
          created_at: new Date().toISOString()
        }, { onConflict: 'instance_id,question_id' });
        
        stimulusList = generated.sequence;
      }
    }

    const screenStateRecord = responsesList.find(r => r.question_id === '__screen_state');
    const filteredResponses = responsesList.filter(
      r => r.question_id !== '__screen_state' && r.question_id !== '__stimulus_list'
    );

    return {
      instance: activeInstance,
      responses: filteredResponses,
      screenState: screenStateRecord ? screenStateRecord.response : null,
      stimulusList
    };
  }
}
