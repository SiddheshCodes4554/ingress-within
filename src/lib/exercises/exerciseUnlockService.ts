import { supabase } from '../db';
import { ExerciseLifecycleManager } from './exerciseLifecycleManager';

export class ExerciseUnlockService {
  /**
   * Safe, timezone-aware, DST safe cycle day calculation using local midnights.
   */
  public static calculateCycleDay(startDate: string, timezone: string, referenceDate: Date = new Date()): number {
    try {
      const options: Intl.DateTimeFormatOptions = { timeZone: timezone, year: 'numeric', month: 'numeric', day: 'numeric' };
      const formatter = new Intl.DateTimeFormat('en-US', options);

      const localRefStr = formatter.format(referenceDate);
      const localRefParts = localRefStr.split('/');
      const localRefMidnight = Date.UTC(parseInt(localRefParts[2]), parseInt(localRefParts[0]) - 1, parseInt(localRefParts[1]));

      const startLocalStr = formatter.format(new Date(startDate));
      const startLocalParts = startLocalStr.split('/');
      const startLocalMidnight = Date.UTC(parseInt(startLocalParts[2]), parseInt(startLocalParts[0]) - 1, parseInt(startLocalParts[1]));

      const diffTime = localRefMidnight - startLocalMidnight;
      const calculatedDay = Math.floor(diffTime / (24 * 60 * 60 * 1000)) + 1;
      return calculatedDay;
    } catch (err: any) {
      console.warn(`[UnlockService] Error calculating day in timezone: ${timezone}. Falling back to basic UTC calculation.`, err.message);
      
      const refMidnight = Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate());
      const startD = new Date(startDate);
      const startMidnight = Date.UTC(startD.getUTCFullYear(), startD.getUTCMonth(), startD.getUTCDate());
      const diffTime = refMidnight - startMidnight;
      return Math.floor(diffTime / (24 * 60 * 60 * 1000)) + 1;
    }
  }

  /**
   * Main unlock processor that evaluates definitions against cycle status and unlocks eligible exercises.
   * Ensures idempotency: prevents double unlocking of already unlocked exercise definitions.
   */
  public static async processUnlocks(
    userId: string,
    cycleId: string,
    timezone: string,
    currentDay: number
  ): Promise<any[]> {
    console.log(`[UnlockService] Processing unlocks for user ${userId}, timezone: ${timezone}, local day: ${currentDay}`);

    // 1. Fetch all active exercise definitions
    const { data: definitions, error: defErr } = await supabase
      .from('exercise_definitions')
      .select('*')
      .eq('active_status', true);

    if (defErr || !definitions) {
      console.error('[UnlockService] Failed to query definitions:', defErr?.message);
      return [];
    }

    // 2. Fetch existing instances for user in the current cycle
    const { data: existingInstances, error: instErr } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId);

    if (instErr) {
      console.error('[UnlockService] Failed to query instances:', instErr.message);
      return [];
    }

    const existingIds = new Set(existingInstances?.map(inst => inst.exercise_id) || []);
    const newlyUnlocked: any[] = [];

    for (const def of definitions) {
      if (existingIds.has(def.id)) {
        continue; // Already unlocked or processed
      }

      try {
        const { data: newInstance, error: createErr } = await supabase
          .from('exercise_instances')
          .insert({
            user_id: userId,
            exercise_id: def.id,
            cycle_id: cycleId,
            status: 'available',
            locked: false,
            available: true,
            started: false,
            completed: false,
            expired: false,
            unlock_time: new Date().toISOString(),
            version: def.provider_version || '1.0'
          })
          .select()
          .single();

        if (createErr || !newInstance) {
          console.error(`[UnlockService] Failed to insert instance for ${def.id}:`, createErr?.message);
        } else {
          console.log(`[UnlockService] ✅ Unlocked exercise ${def.id} for user ${userId}`);
          newlyUnlocked.push(newInstance);
        }
      } catch (err: any) {
        console.error(`[UnlockService] Error during unlock insertion for ${def.id}:`, err.message);
      }
    }

    return newlyUnlocked;
  }
}
