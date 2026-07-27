import { supabase } from '../../../../lib/db';
import { Exercise2Instance, Exercise2Result, Exercise2Status } from '../types/exercise2.types';
import { Exercise2UnlockService } from './exercise2UnlockService';
import { EXERCISE_2_CONFIG } from '../definitions/exercise2Catalog';

export class Exercise2Service {
  private static VALID_TRANSITIONS: Record<Exercise2Status, Exercise2Status[]> = {
    locked: ['available'],
    available: ['in_progress'],
    in_progress: ['analysing'],
    analysing: ['completed', 'failed'],
    completed: [],
    failed: ['analysing', 'in_progress']
  };

  /**
   * Maps domain status to database constraint status.
   */
  public static toDbStatus(status: Exercise2Status): string {
    if (status === 'analysing') return 'processing';
    return status;
  }

  /**
   * Maps database constraint status to domain status.
   */
  public static fromDbStatus(dbStatus: string): Exercise2Status {
    if (dbStatus === 'processing') return 'analysing';
    return dbStatus as Exercise2Status;
  }

  /**
   * Validates state machine transition. Throws error if transition is invalid or skips states.
   */
  public static validateTransition(currentStatus: Exercise2Status, targetStatus: Exercise2Status): void {
    if (currentStatus === targetStatus) return;
    const allowed = this.VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new Error(`[Exercise2StateEngine] Invalid state transition: ${currentStatus} -> ${targetStatus}. State skipping is strictly prohibited.`);
    }
  }

  /**
   * Fetches status of Exercise 2 for user.
   */
  public static async getStatus(userId: string, currentDay: number = 16, currentCycle: number = 1): Promise<Exercise2Status> {
    return await Exercise2UnlockService.evaluateUnlockStatus(userId, currentDay, currentCycle);
  }

  /**
   * Fetches active instance for Exercise 2.
   */
  public static async getCurrentInstance(userId: string): Promise<Exercise2Instance | null> {
    const { data, error } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_id', 'exercise_2')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`[Exercise2Service] getCurrentInstance error: ${error.message}`);
    if (!data) return null;

    return {
      ...data,
      exercise_number: EXERCISE_2_CONFIG.exercise_number,
      cycle_number: EXERCISE_2_CONFIG.cycle,
      status: this.fromDbStatus(data.status),
      current_image: data.current_image || 1,
      current_step: data.current_step || 1
    } as Exercise2Instance;
  }

  /**
   * Atomic creation / start of Exercise 2 instance & draft result.
   */
  public static async startExercise(userId: string, currentDay: number = 16, currentCycle: number = 1): Promise<{ instance: Exercise2Instance; result: Exercise2Result }> {
    const unlockStatus = await Exercise2UnlockService.evaluateUnlockStatus(userId, currentDay, currentCycle);
    if (unlockStatus === 'locked') {
      throw new Error('[Exercise2Service] Exercise 2 is locked. Unlock requirements (Cycle 1, Day >= 16, Exercise 1 completed) not met.');
    }

    // Atomic concurrency check: find existing active or available instance
    const existingInst = await this.getCurrentInstance(userId);
    if (existingInst) {
      if (existingInst.status === 'completed') {
        throw new Error('[Exercise2Service] Exercise 2 has already been completed.');
      }
      if (['started', 'in_progress', 'analysing'].includes(existingInst.status)) {
        const { data: existingResult } = await supabase
          .from('exercise_results')
          .select('*')
          .eq('instance_id', existingInst.id)
          .maybeSingle();

        return { instance: existingInst, result: existingResult as Exercise2Result };
      }
    }

    // 1. Create Instance atomically in state 'in_progress'
    const now = new Date().toISOString();
    const { data: newInst, error: instErr } = await supabase
      .from('exercise_instances')
      .insert({
        user_id: userId,
        exercise_id: 'exercise_2',
        cycle_id: null,
        status: 'in_progress',
        locked: false,
        started: true,
        unlock_time: now,
        started_at: now
      })
      .select()
      .single();

    if (instErr) {
      throw new Error(`[Exercise2Service] Failed to create instance: ${instErr.message}`);
    }

    // 2. Create Draft ExerciseResult record atomically
    const { data: newResult, error: resErr } = await supabase
      .from('exercise_results')
      .insert({
        instance_id: newInst.id,
        user_id: userId,
        summary: '',
        analysis: {
          raw_responses: [],
          generated_image_urls: [],
          generation_seeds: [],
          default_lens_label: 'mixed',
          lens_by_image: [],
          entry_confirmation: 'partial',
          de_animation_flag: false,
          most_revealing_image: 3,
          performance_flag: false,
          ai_analysis_text: null
        },
        model: 'inkblot-foundation-v2',
        provider: 'groq',
        raw_json: {},
        generated_at: now
      })
      .select()
      .single();

    if (resErr) {
      // Rollback instance if result creation fails
      await supabase.from('exercise_instances').delete().eq('id', newInst.id);
      throw new Error(`[Exercise2Service] Failed to create draft ExerciseResult: ${resErr.message}`);
    }

    const formattedInst: Exercise2Instance = {
      id: newInst.id,
      user_id: newInst.user_id,
      cycle_number: EXERCISE_2_CONFIG.cycle,
      exercise_number: EXERCISE_2_CONFIG.exercise_number,
      exercise_id: 'exercise_2',
      status: 'in_progress',
      current_image: 1,
      current_step: 1,
      started_at: now,
      completed_at: null,
      created_at: newInst.created_at,
      updated_at: newInst.updated_at
    };

    const formattedResult: Exercise2Result = {
      id: newResult.id,
      exercise_instance_id: newResult.instance_id,
      user_id: newResult.user_id,
      raw_responses: [],
      generated_image_urls: [],
      generation_seeds: [],
      default_lens_label: 'mixed',
      lens_by_image: [],
      entry_confirmation: 'partial',
      de_animation_flag: false,
      most_revealing_image: 3,
      performance_flag: false,
      ai_analysis_text: null,
      entry_count_at_completion: null,
      completed_at: null,
      status: 'in_progress',
      created_at: newResult.generated_at
    };

    return { instance: formattedInst, result: formattedResult };
  }

  /**
   * Transition state machine for an instance.
   */
  public static async transitionStatus(instanceId: string, targetStatus: Exercise2Status): Promise<Exercise2Instance> {
    const { data: inst, error: fetchErr } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (fetchErr || !inst) {
      throw new Error(`[Exercise2Service] Instance not found: ${instanceId}`);
    }

    const currentStatus = this.fromDbStatus(inst.status);
    this.validateTransition(currentStatus, targetStatus);

    const dbTargetStatus = this.toDbStatus(targetStatus);
    const updatePayload: any = { status: dbTargetStatus, updated_at: new Date().toISOString() };

    if (targetStatus === 'completed' || targetStatus === 'failed') {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { data: updated, error: updateErr } = await supabase
      .from('exercise_instances')
      .update(updatePayload)
      .eq('id', instanceId)
      .select()
      .single();

    if (updateErr) {
      throw new Error(`[Exercise2Service] Failed to transition status: ${updateErr.message}`);
    }

    return {
      ...updated,
      exercise_number: EXERCISE_2_CONFIG.exercise_number,
      cycle_number: EXERCISE_2_CONFIG.cycle,
      status: this.fromDbStatus(updated.status),
      current_image: updated.current_image || 1,
      current_step: updated.current_step || 1
    } as Exercise2Instance;
  }
}
