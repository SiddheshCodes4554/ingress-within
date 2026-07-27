import { supabase } from '../../../../lib/db';
import { Exercise3Status } from '../types/exercise3.types';
import { EXERCISE_3_CONFIG, EXERCISE_3_DEFINITION } from '../definitions/exercise3Catalog';
import { Exercise3UnlockService } from './exercise3UnlockService';
import { ExerciseRepository } from '../repository/exerciseRepository';

export class Exercise3Service {
  /**
   * Helper to map DB status string to domain status.
   */
  public static fromDbStatus(statusStr: string): Exercise3Status {
    switch (statusStr) {
      case 'processing':
      case 'submitted':
        return 'analysing';
      case 'started':
        return 'in_progress';
      case 'locked':
      case 'available':
      case 'in_progress':
      case 'completed':
      case 'failed':
        return statusStr as Exercise3Status;
      default:
        return 'available';
    }
  }

  /**
   * Helper to map domain status to DB status string.
   */
  public static toDbStatus(status: Exercise3Status): string {
    switch (status) {
      case 'analysing':
      case 'submitted':
        return 'processing';
      case 'in_progress':
      case 'started':
        return 'in_progress';
      default:
        return status;
    }
  }

  /**
   * Retrieves or initializes Exercise 3 instance for a given user.
   */
  public static async getOrInitializeInstance(userId: string, day: number = 23, cycle: number = 1): Promise<{ instance: any; responses: any[] }> {
    // Ensure definition exists in exercise_definitions
    await ExerciseRepository.upsertDefinition(EXERCISE_3_DEFINITION).catch(() => {});

    const unlockStatus = await Exercise3UnlockService.evaluateUnlockStatus(userId, day, cycle);

    const { data: existing } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_id', 'exercise_3')
      .maybeSingle();

    if (existing) {
      const responses = await this.getResponses(existing.id);
      return {
        instance: {
          ...existing,
          status: this.fromDbStatus(existing.status)
        },
        responses
      };
    }

    // Create new instance with evaluated unlock status
    const dbStatus = this.toDbStatus(unlockStatus);
    const { data: newInst, error } = await supabase
      .from('exercise_instances')
      .insert({
        user_id: userId,
        exercise_id: 'exercise_3',
        status: dbStatus
      })
      .select()
      .single();

    if (error) throw new Error(`[Exercise3Service] Failed to create instance: ${error.message}`);

    return {
      instance: {
        ...newInst,
        status: unlockStatus
      },
      responses: []
    };
  }

  /**
   * Starts Exercise 3 instance for a user.
   */
  public static async startExercise(userId: string, day: number = 23, cycle: number = 1): Promise<{ instance: any }> {
    const unlockStatus = await Exercise3UnlockService.evaluateUnlockStatus(userId, day, cycle);
    if (unlockStatus === 'locked') {
      throw new Error('Exercise 3 is locked. Complete Exercise 2 and reach Day 23 first.');
    }

    const { instance } = await this.getOrInitializeInstance(userId, day, cycle);

    if (instance.status === 'available') {
      const now = new Date().toISOString();
      const { data: updated, error } = await supabase
        .from('exercise_instances')
        .update({
          status: 'in_progress',
          started_at: now,
          updated_at: now
        })
        .eq('id', instance.id)
        .select()
        .single();

      if (error) throw new Error(`[Exercise3Service] Failed to start exercise: ${error.message}`);
      return { instance: { ...updated, status: 'in_progress' } };
    }

    return { instance };
  }

  /**
   * Resumes an existing Exercise 3 instance.
   */
  public static async resumeExercise(instanceId: string, userId: string): Promise<{ instance: any; responses: any[] }> {
    const { data: inst, error } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (error || !inst) {
      throw new Error(`[Exercise3Service] Instance not found: ${instanceId}`);
    }

    if (inst.user_id !== userId) {
      throw new Error('[Exercise3Service] Access denied.');
    }

    const responses = await this.getResponses(instanceId);
    return {
      instance: {
        ...inst,
        status: this.fromDbStatus(inst.status)
      },
      responses
    };
  }

  /**
   * Fetches stored responses for Exercise 3 instance.
   */
  private static async getResponses(instanceId: string): Promise<any[]> {
    const { data } = await supabase
      .from('exercise_responses')
      .select('*')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: true });
    return data || [];
  }
}
