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

      const rules = def.unlock_rules || {};
      let shouldUnlock = false;

      switch (rules.strategy) {
        case 'immediate':
          if (currentDay >= 1) {
            shouldUnlock = true;
          }
          break;
        case 'day_milestone':
          if (rules.day && currentDay >= rules.day) {
            shouldUnlock = true;
          }
          break;
        case 'manual':
          // Require manual admin override
          shouldUnlock = false;
          break;
        default:
          // Placeholders for future triggers:
          // 'weekly', 'monthly', 'branch', 'knowledge_trigger', 'pattern_trigger', 'assessment_trigger'
          shouldUnlock = false;
          break;
      }

      if (shouldUnlock) {
        if (def.id === 'exercise_1') {
          // Check prerequisites:
          // 1. Completed Exercise 0
          const { data: ex0, error: ex0Err } = await supabase
            .from('exercise_instances')
            .select('id')
            .eq('user_id', userId)
            .eq('exercise_id', 'exercise_0')
            .eq('status', 'finished')
            .maybeSingle();

          if (ex0Err || !ex0) {
            console.log(`[UnlockService] Skipping exercise_1 unlock for user ${userId}: Exercise 0 is not completed.`);
            continue;
          }

          // 2. User has at least 9 journal entries
          const { count: entriesCount, error: entriesErr } = await supabase
            .from('entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

          if (entriesErr || entriesCount === null || entriesCount < 9) {
            console.log(`[UnlockService] Skipping exercise_1 unlock for user ${userId}: Under 9 entries (${entriesCount}).`);
            continue;
          }

          // 3. Vocabulary Engine snapshot exists
          const { data: vocabSnap, error: vocabErr } = await supabase
            .from('vocab_snapshots')
            .select('id')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();

          if (vocabErr || !vocabSnap) {
            console.log(`[UnlockService] Skipping exercise_1 unlock for user ${userId}: No vocabulary snapshot found.`);
            continue;
          }

          // 4. Knowledge snapshot exists
          const { data: knowledgeSnap, error: knowledgeErr } = await supabase
            .from('knowledge_snapshots')
            .select('id')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();

          if (knowledgeErr || !knowledgeSnap) {
            console.log(`[UnlockService] Skipping exercise_1 unlock for user ${userId}: No knowledge snapshot found.`);
            continue;
          }
        }

        try {
          // Double check constraint check by attempting insertion
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

            // Log event trace
            await supabase.from('exercise_events').insert({
              instance_id: newInstance.id,
              user_id: userId,
              event_type: 'unlocked',
              payload: { strategy: rules.strategy, auto: true }
            });

            // Broadcast unlocked event via manager event flow (to notify orchestrator)
            const { ExerciseEventPublisher } = await import('./exerciseEventPublisher');
            await ExerciseEventPublisher.publishUnlocked(userId, {
              instance_id: newInstance.id,
              exercise_id: def.id,
              cycle_id: cycleId
            });
          }
        } catch (err: any) {
          console.error(`[UnlockService] Error during unlock insertion for ${def.id}:`, err.message);
        }
      }
    }

    return newlyUnlocked;
  }
}
