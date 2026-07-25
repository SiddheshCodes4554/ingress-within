import { supabase } from '../db';

export interface DefaultExerciseDefinition {
  id: string;
  title?: string;
  description?: string;
  exercise_type: string;
  unlock_rules: {
    strategy: 'day_milestone' | 'immediate';
    day: number;
  };
  cycle: number;
  frequency: string;
  estimated_duration: number;
  provider_version: string;
  prompt_version: string;
  active_status: boolean;
}

export const CORE_EXERCISE_DEFINITIONS: DefaultExerciseDefinition[] = [
  {
    id: 'exercise_0',
    title: 'Baseline Personality Assessment (OCEAN)',
    description: 'Establishes your baseline Big Five personality profile across 16 reflective psychometric dimensions.',
    exercise_type: 'ocean',
    unlock_rules: { strategy: 'day_milestone', day: 1 },
    cycle: 1,
    frequency: 'once_per_cycle',
    estimated_duration: 10,
    provider_version: '1.0',
    prompt_version: 'v1',
    active_status: true
  },
  {
    id: 'exercise_1',
    title: 'Guided Reflection Assessment (Word Association)',
    description: 'Measures emotional language defaults and spontaneous subconscious theme associations.',
    exercise_type: 'word_association',
    unlock_rules: { strategy: 'day_milestone', day: 1 },
    cycle: 1,
    frequency: 'once_per_cycle',
    estimated_duration: 5,
    provider_version: '1.0',
    prompt_version: 'v1',
    active_status: true
  },
  {
    id: 'exercise_2',
    title: 'Inkblot / Projective Assessment',
    description: 'Procedural projective assessment exploring symbolic interpretations and perceptual pattern defaults.',
    exercise_type: 'inkblot',
    unlock_rules: { strategy: 'day_milestone', day: 7 },
    cycle: 1,
    frequency: 'once_per_cycle',
    estimated_duration: 8,
    provider_version: '1.0',
    prompt_version: 'v1',
    active_status: true
  },
  {
    id: 'exercise_3',
    title: 'Self-Perception vs Reality Check',
    description: 'Compares your self-described tendencies against objective writing history, patterns, and knowledge profile evidence.',
    exercise_type: 'cbt',
    unlock_rules: { strategy: 'day_milestone', day: 14 },
    cycle: 1,
    frequency: 'once_per_cycle',
    estimated_duration: 10,
    provider_version: '1.0',
    prompt_version: 'v1',
    active_status: true
  }
];

export class ExerciseInitializationService {
  /**
   * 1. Ensures core exercise definitions exist in the database and unlock rules are correctly configured.
   */
  public static async ensureDefinitionsExist(): Promise<void> {
    const { data: existing, error } = await supabase
      .from('exercise_definitions')
      .select('id, unlock_rules, active_status');

    if (error) {
      console.error('[ExerciseInit] Failed to check exercise definitions:', error.message);
      return;
    }

    const existingMap = new Map((existing || []).map(d => [d.id, d]));

    for (const def of CORE_EXERCISE_DEFINITIONS) {
      const current = existingMap.get(def.id);
      if (!current) {
        console.log(`[ExerciseInit] Seeding missing exercise definition: ${def.id}`);
        // Strip non-DB properties before inserting into exercise_definitions
        const { title, description, ...dbFields } = def;
        const { error: insertErr } = await supabase
          .from('exercise_definitions')
          .insert(dbFields);

        if (insertErr) {
          console.error(`[ExerciseInit] Error seeding definition ${def.id}:`, insertErr.message);
        }
      } else {
        // Update unlock rules and ensure active_status is true
        const targetDay = def.unlock_rules.day;
        const currentDayRule = current.unlock_rules?.day;
        if (currentDayRule !== targetDay || !current.active_status) {
          console.log(`[ExerciseInit] Harmonizing unlock rules and active_status for ${def.id}`);
          await supabase
            .from('exercise_definitions')
            .update({
              unlock_rules: def.unlock_rules,
              active_status: true
            })
            .eq('id', def.id);
        }
      }
    }
  }

  /**
   * 2. Self-healing user instance synchronization.
   * Ensures every exercise definition has an instance in the user's active cycle.
   */
  public static async syncUserInstances(
    userId: string,
    cycleId: string,
    currentDay: number = 1,
    isCompletedCycle: boolean = false
  ): Promise<any[]> {
    if (!userId || !cycleId) return [];

    // Ensure definitions exist first
    await this.ensureDefinitionsExist();

    // 1. Fetch all active exercise definitions
    const { data: definitions, error: defErr } = await supabase
      .from('exercise_definitions')
      .select('*')
      .eq('active_status', true);

    if (defErr || !definitions) {
      console.error('[ExerciseInit] Failed to query definitions for sync:', defErr?.message);
      return [];
    }

    // 2. Fetch existing instances for user in cycle
    const { data: existingInstances, error: instErr } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId);

    if (instErr) {
      console.error('[ExerciseInit] Failed to query user instances:', instErr.message);
      return [];
    }

    const instanceMap = new Map((existingInstances || []).map(inst => [inst.exercise_id, inst]));
    const syncedInstances: any[] = [];

    for (const def of definitions) {
      const unlockDay = def.unlock_rules?.day || 1;
      const isUnlocked = isCompletedCycle || currentDay >= unlockDay;
      const existing = instanceMap.get(def.id);

      if (!existing) {
        // Create missing instance
        const status = isUnlocked ? 'available' : 'locked';
        console.log(`[ExerciseInit] Creating missing instance for ${def.id} (status: ${status})`);
        
        const { data: newInst, error: createErr } = await supabase
          .from('exercise_instances')
          .insert({
            user_id: userId,
            exercise_id: def.id,
            cycle_id: cycleId,
            status,
            locked: !isUnlocked,
            available: isUnlocked,
            started: false,
            completed: false,
            expired: false,
            unlock_time: isUnlocked ? new Date().toISOString() : null,
            version: def.provider_version || '1.0'
          })
          .select()
          .single();

        if (createErr) {
          console.error(`[ExerciseInit] Error creating instance for ${def.id}:`, createErr.message);
        } else if (newInst) {
          syncedInstances.push(newInst);
        }
      } else {
        // Update locked instance if now eligible for unlock
        if (existing.status === 'locked' && isUnlocked) {
          console.log(`[ExerciseInit] Unlocking previously locked instance ${def.id} for user ${userId}`);
          const { data: updatedInst } = await supabase
            .from('exercise_instances')
            .update({
              status: 'available',
              locked: false,
              available: true,
              unlock_time: new Date().toISOString()
            })
            .eq('id', existing.id)
            .select()
            .single();

          syncedInstances.push(updatedInst || { ...existing, status: 'available', locked: false, available: true });
        } else {
          syncedInstances.push(existing);
        }
      }
    }

    return syncedInstances;
  }

  /**
   * 3. Calculates exact exercise lifecycle summary counts for the dashboard.
   */
  public static async getSummaryCounts(userId: string, cycleId: string) {
    const { data: instances } = await supabase
      .from('exercise_instances')
      .select('status')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId);

    const counts = {
      available: 0,
      pending: 0,
      completed: 0,
      locked: 0,
      total: instances?.length || 0
    };

    (instances || []).forEach(inst => {
      if (['available', 'started', 'in_progress'].includes(inst.status)) {
        counts.available++;
      } else if (['completed', 'queued', 'analysing'].includes(inst.status)) {
        counts.pending++;
      } else if (['finished'].includes(inst.status)) {
        counts.completed++;
      } else if (inst.status === 'locked') {
        counts.locked++;
      }
    });

    return counts;
  }
}
