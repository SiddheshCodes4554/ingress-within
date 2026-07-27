import { supabase } from '../../../../lib/db';
import { Exercise3Status } from '../types/exercise3.types';
import { EXERCISE_3_CONFIG } from '../definitions/exercise3Catalog';

export class Exercise3UnlockService {
  /**
   * Evaluates unlock conditions for Exercise 3:
   * - cycle == 1
   * - day >= 23
   * - Exercise 2 completed
   * - No completed Exercise 3 instance
   */
  public static async evaluateUnlockStatus(userId: string, currentDay: number = 23, currentCycle: number = 1): Promise<Exercise3Status> {
    if (currentCycle !== EXERCISE_3_CONFIG.cycle) {
      return 'locked';
    }

    if (currentDay < EXERCISE_3_CONFIG.unlock_day) {
      return 'locked';
    }

    // Check if Exercise 3 is already completed
    const { data: completedEx3 } = await supabase
      .from('exercise_instances')
      .select('id, status')
      .eq('user_id', userId)
      .eq('exercise_id', 'exercise_3')
      .eq('status', 'completed')
      .limit(1);

    if (completedEx3 && completedEx3.length > 0) {
      return 'completed';
    }

    // Check if Exercise 2 is completed
    const { data: ex2Instance } = await supabase
      .from('exercise_instances')
      .select('id, status')
      .eq('user_id', userId)
      .eq('exercise_id', 'exercise_2')
      .eq('status', 'completed')
      .limit(1);

    if (!ex2Instance || ex2Instance.length === 0) {
      return 'locked';
    }

    // Check if active in_progress or analysing instance exists for Exercise 3
    const { data: activeEx3 } = await supabase
      .from('exercise_instances')
      .select('id, status')
      .eq('user_id', userId)
      .eq('exercise_id', 'exercise_3')
      .in('status', ['started', 'in_progress', 'analysing'])
      .limit(1);

    if (activeEx3 && activeEx3.length > 0) {
      return activeEx3[0].status as Exercise3Status;
    }

    return 'available';
  }

  /**
   * Evaluates and backfills Exercise 3 instances for eligible historical users.
   */
  public static async ensureAvailableForEligibleUsers(): Promise<number> {
    const { data: completedEx2Users } = await supabase
      .from('exercise_instances')
      .select('user_id')
      .eq('exercise_id', 'exercise_2')
      .eq('status', 'completed');

    if (!completedEx2Users || completedEx2Users.length === 0) {
      return 0;
    }

    const uniqueUserIds = Array.from(new Set(completedEx2Users.map(u => u.user_id)));
    let createdCount = 0;

    for (const userId of uniqueUserIds) {
      const { data: existingEx3 } = await supabase
        .from('exercise_instances')
        .select('id')
        .eq('user_id', userId)
        .eq('exercise_id', 'exercise_3')
        .limit(1);

      if (!existingEx3 || existingEx3.length === 0) {
        await supabase.from('exercise_instances').insert({
          user_id: userId,
          exercise_id: 'exercise_3',
          status: 'available'
        });
        createdCount++;
      }
    }

    return createdCount;
  }
}
