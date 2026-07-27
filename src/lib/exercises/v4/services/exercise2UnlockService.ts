import { supabase } from '../../../../lib/db';
import { Exercise2Status } from '../types/exercise2.types';
import { EXERCISE_2_CONFIG } from '../definitions/exercise2Catalog';

export class Exercise2UnlockService {
  /**
   * Evaluates unlock conditions for Exercise 2:
   * - cycle == 1
   * - day >= 16
   * - Exercise 1 completed
   * - No completed Exercise 2 instance
   */
  public static async evaluateUnlockStatus(userId: string, currentDay: number = 16, currentCycle: number = 1): Promise<Exercise2Status> {
    if (currentCycle !== EXERCISE_2_CONFIG.cycle) {
      return 'locked';
    }

    if (currentDay < EXERCISE_2_CONFIG.unlock_day) {
      return 'locked';
    }

    // Check if Exercise 2 is already completed
    const { data: completedEx2 } = await supabase
      .from('exercise_instances')
      .select('id, status')
      .eq('user_id', userId)
      .eq('exercise_id', 'exercise_2')
      .eq('status', 'completed')
      .limit(1);

    if (completedEx2 && completedEx2.length > 0) {
      return 'completed';
    }

    // Check if Exercise 1 is completed
    const { data: ex1Instance } = await supabase
      .from('exercise_instances')
      .select('id, status')
      .eq('user_id', userId)
      .eq('exercise_id', 'exercise_1')
      .eq('status', 'completed')
      .limit(1);

    if (!ex1Instance || ex1Instance.length === 0) {
      return 'locked';
    }

    // Check if active in_progress or analysing instance exists for Exercise 2
    const { data: activeEx2 } = await supabase
      .from('exercise_instances')
      .select('id, status')
      .eq('user_id', userId)
      .eq('exercise_id', 'exercise_2')
      .in('status', ['started', 'in_progress', 'analysing'])
      .limit(1);

    if (activeEx2 && activeEx2.length > 0) {
      return activeEx2[0].status as Exercise2Status;
    }

    return 'available';
  }
}
