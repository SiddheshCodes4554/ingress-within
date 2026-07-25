import { supabase } from '../db';
import { ExerciseInitializationService } from './exerciseInitializationService';

export class ExerciseMigrationService {
  /**
   * Evaluates all users in the database, checks historical cycles, journals, reports,
   * and creates missing exercise instances idempotently without duplicating existing instances.
   */
  public static async migrateAllUsers(): Promise<{ usersMigrated: number; totalInstancesCreated: number }> {
    console.log('[ExerciseMigration] Starting automated historical user migration...');

    // 1. Ensure core definitions exist with founder-approved titles
    await ExerciseInitializationService.ensureDefinitionsExist();

    // 2. Fetch all users
    const { data: users, error: userErr } = await supabase.from('users').select('id');
    if (userErr || !users) {
      console.error('[ExerciseMigration] Failed to fetch users:', userErr?.message);
      return { usersMigrated: 0, totalInstancesCreated: 0 };
    }

    let totalInstancesCreated = 0;
    let usersMigrated = 0;

    for (const user of users) {
      // Fetch all cycles for user
      const { data: cycles } = await supabase
        .from('cycles')
        .select('id, cycle_number, status, current_day')
        .eq('user_id', user.id)
        .order('cycle_number', { ascending: true });

      if (!cycles || cycles.length === 0) {
        // Create initial active cycle if user has no cycle
        const { data: newCycle } = await supabase
          .from('cycles')
          .insert({
            user_id: user.id,
            cycle_number: 1,
            current_day: 1,
            status: 'ACTIVE'
          })
          .select()
          .single();

        if (newCycle) {
          const instances = await ExerciseInitializationService.syncUserInstances(user.id, newCycle.id, 1, false);
          totalInstancesCreated += instances.length;
        }
      } else {
        for (const cycle of cycles) {
          const isCompleted = cycle.status === 'COMPLETED';
          const day = isCompleted ? 14 : (cycle.current_day || 1);
          const instances = await ExerciseInitializationService.syncUserInstances(user.id, cycle.id, day, isCompleted);
          totalInstancesCreated += instances.length;
        }
      }
      usersMigrated++;
    }

    console.log(`[ExerciseMigration] Completed migration for ${usersMigrated} users. Synced ${totalInstancesCreated} instances.`);
    return { usersMigrated, totalInstancesCreated };
  }
}
