import { supabase } from '../../../../lib/db';
import { ExerciseDefinition, ExerciseInstance, ExerciseResponse, ExerciseResult, ExerciseEvent } from '../types/exercise.types';

export class ExerciseRepository {
  // --- DEFINITIONS ---
  public static async getDefinition(id: string): Promise<ExerciseDefinition | null> {
    const { data, error } = await supabase
      .from('exercise_definitions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`[ExerciseRepository] getDefinition error: ${error.message}`);
    if (!data) return null;

    return {
      id: data.id,
      exercise_type: data.exercise_type,
      title: data.display_configuration?.title || data.id,
      description: data.display_configuration?.description || '',
      unlock_rules: data.unlock_rules,
      cycle: data.cycle,
      frequency: data.frequency,
      estimated_duration: data.estimated_duration,
      active_status: data.active_status,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  public static async getAllActiveDefinitions(): Promise<ExerciseDefinition[]> {
    const { data, error } = await supabase
      .from('exercise_definitions')
      .select('*')
      .eq('active_status', true);

    if (error) throw new Error(`[ExerciseRepository] getAllActiveDefinitions error: ${error.message}`);
    return (data || []).map(d => ({
      id: d.id,
      exercise_type: d.exercise_type,
      title: d.display_configuration?.title || d.id,
      description: d.display_configuration?.description || '',
      unlock_rules: d.unlock_rules,
      cycle: d.cycle,
      frequency: d.frequency,
      estimated_duration: d.estimated_duration,
      active_status: d.active_status,
      created_at: d.created_at,
      updated_at: d.updated_at
    }));
  }

  public static async upsertDefinition(def: ExerciseDefinition): Promise<ExerciseDefinition> {
    const dbPayload = {
      id: def.id,
      exercise_type: def.exercise_type,
      unlock_rules: def.unlock_rules || {},
      cycle: def.cycle || 1,
      frequency: def.frequency || 'once_per_cycle',
      estimated_duration: def.estimated_duration || 5,
      active_status: def.active_status !== undefined ? def.active_status : true,
      display_configuration: {
        title: def.title,
        description: def.description || ''
      },
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('exercise_definitions')
      .upsert(dbPayload)
      .select()
      .single();

    if (error) throw new Error(`[ExerciseRepository] upsertDefinition error: ${error.message}`);
    return {
      id: data.id,
      exercise_type: data.exercise_type,
      title: data.display_configuration?.title || data.id,
      description: data.display_configuration?.description || '',
      unlock_rules: data.unlock_rules,
      cycle: data.cycle,
      frequency: data.frequency,
      estimated_duration: data.estimated_duration,
      active_status: data.active_status,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  // --- INSTANCES ---
  public static async getInstance(id: string): Promise<ExerciseInstance | null> {
    const { data, error } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`[ExerciseRepository] getInstance error: ${error.message}`);
    return data;
  }

  public static async getInstanceByUserAndExercise(userId: string, cycleId: string | undefined, exerciseId: string): Promise<ExerciseInstance | null> {
    let query = supabase
      .from('exercise_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId);

    if (cycleId) {
      query = query.eq('cycle_id', cycleId);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error(`[ExerciseRepository] getInstanceByUserAndExercise error: ${error.message}`);
    return data;
  }

  /**
   * Retrieves user exercise instances, auto-healing completed baseline assessment status.
   */
  public static async getUserInstances(userId: string, cycleId?: string): Promise<ExerciseInstance[]> {
    // 0. Auto-heal check: Check if user completed onboarding baseline assessment
    let hasCompletedBaselineOnboarding = false;
    let userData: any = null;
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('assessment_completed, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      const { data: userRow } = await supabase
        .from('users')
        .select('ocean_openness, personality_summary_text, personality_profile_json')
        .eq('id', userId)
        .maybeSingle();

      userData = userRow;
      hasCompletedBaselineOnboarding =
        userProfile?.assessment_completed === true ||
        userProfile?.onboarding_completed === true ||
        userRow?.ocean_openness !== null ||
        userRow?.personality_profile_json !== null ||
        !!userRow?.personality_summary_text;
    } catch (e) {
      console.warn('[ExerciseRepository] Check onboarding baseline error:', e);
    }

    let query = supabase.from('exercise_instances').select('*').eq('user_id', userId);
    if (cycleId) query = query.eq('cycle_id', cycleId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(`[ExerciseRepository] getUserInstances error: ${error.message}`);
    
    const rows = data || [];
    
    // Deduplicate by exercise_id prioritizing completed > in_progress > available > locked
    const statusPriority: Record<string, number> = {
      completed: 5,
      processing: 4,
      analysing: 4,
      in_progress: 3,
      started: 3,
      available: 2,
      locked: 1
    };

    const deduplicatedMap = new Map<string, ExerciseInstance>();

    for (const inst of rows) {
      const exId = inst.exercise_id;
      const existing = deduplicatedMap.get(exId);

      if (!existing) {
        deduplicatedMap.set(exId, inst);
      } else {
        const pCurrent = statusPriority[inst.status] || 0;
        const pExisting = statusPriority[existing.status] || 0;

        if (pCurrent > pExisting) {
          deduplicatedMap.set(exId, inst);
        }
      }
    }

    // Auto-heal exercise_0 if user completed onboarding baseline assessment
    if (hasCompletedBaselineOnboarding) {
      const ex0 = deduplicatedMap.get('exercise_0') || deduplicatedMap.get('ocean');
      if (!ex0 || ex0.status !== 'completed') {
        const nowIso = new Date().toISOString();
        try {
          const { data: healedInst } = await supabase
            .from('exercise_instances')
            .upsert({
              user_id: userId,
              exercise_id: 'exercise_0',
              status: 'completed',
              unlock_time: nowIso,
              started_at: nowIso,
              submitted_at: nowIso,
              completed_at: nowIso,
              updated_at: nowIso
            }, { onConflict: 'user_id,exercise_id' })
            .select()
            .single();

          if (healedInst) {
            deduplicatedMap.set('exercise_0', healedInst);

            // Also ensure exercise_results exists for exercise_0
            if (userData) {
              await supabase
                .from('exercise_results')
                .upsert({
                  instance_id: healedInst.id,
                  user_id: userId,
                  exercise_id: 'exercise_0',
                  summary: userData.personality_summary_text || 'Baseline psychometric profile recorded during onboarding.',
                  metrics: {
                    openness: userData.ocean_openness || 3,
                    calculated_at: nowIso
                  },
                  created_at: nowIso
                }, { onConflict: 'instance_id' });
            }
          }
        } catch (healErr) {
          console.warn('[ExerciseRepository] Auto-heal exercise_0 error:', healErr);
        }
      }
    }

    // Ensure exercise_definitions table contains definitions for all 8 core exercises
    try {
      const { EXERCISE_0_DEFINITION } = await import('../definitions/exercise0Catalog');
      const { EXERCISE_1_DEFINITION } = await import('../definitions/exercise1Catalog');
      const { EXERCISE_2_DEFINITION } = await import('../definitions/exercise2Catalog');
      const { EXERCISE_3_DEFINITION } = await import('../definitions/exercise3Catalog');
      const { CORE_VALUES_DEFINITION } = await import('../definitions/coreValuesCatalog');
      const { RELATIONSHIP_MAP_DEFINITION } = await import('../definitions/relationshipMapCatalog');
      const { BODY_SIGNAL_INVENTORY_DEFINITION } = await import('../definitions/bodySignalCatalog');
      const { AVOIDANCE_AUDIT_DEFINITION } = await import('../definitions/avoidanceAuditCatalog');

      const defs = [
        EXERCISE_0_DEFINITION,
        EXERCISE_1_DEFINITION,
        EXERCISE_2_DEFINITION,
        EXERCISE_3_DEFINITION,
        CORE_VALUES_DEFINITION,
        RELATIONSHIP_MAP_DEFINITION,
        BODY_SIGNAL_INVENTORY_DEFINITION,
        AVOIDANCE_AUDIT_DEFINITION
      ];

      for (const def of defs) {
        await ExerciseRepository.upsertDefinition(def).catch(() => {});
      }
    } catch (defErr) {
      console.warn('[ExerciseRepository] Auto-upsert definitions warning:', defErr);
    }

    // Fetch user cycle to compute accumulated total days for unlock evaluation
    let totalUserDays = 1;
    try {
      const { data: latestCycle } = await supabase
        .from('cycles')
        .select('cycle_number, number, current_day')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestCycle) {
        const cNum = latestCycle.cycle_number || latestCycle.number || 1;
        const cDay = latestCycle.current_day || 1;
        totalUserDays = (cNum - 1) * 30 + cDay;
      }
    } catch (cycleErr) {
      console.warn('[ExerciseRepository] Error fetching user cycle for unlock evaluation:', cycleErr);
    }
    // Fetch total journal entries count for entry-requirement exercises (e.g. relationship_map requires 5+ total entries)
    let userEntryCount = 0;
    try {
      const { count } = await supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      userEntryCount = count || 0;
    } catch (entryErr) {
      console.warn('[ExerciseRepository] Error fetching entry count:', entryErr);
    }

    // Fetch user's fixed Day 30 assessment (or latest assessment) for Month 3 branch routing & secondary modifications
    let userBranch = 'A';
    let assessmentScores: { sa_avg?: number; ei_avg?: number; dt_score?: number } = {};
    try {
      const { data: assRow } = await supabase
        .from('assessments')
        .select('branch_assignment, sa_avg, ei_avg, dt_score')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (assRow) {
        if (assRow.branch_assignment) userBranch = assRow.branch_assignment;
        assessmentScores = {
          sa_avg: assRow.sa_avg !== null ? Number(assRow.sa_avg) : undefined,
          ei_avg: assRow.ei_avg !== null ? Number(assRow.ei_avg) : undefined,
          dt_score: assRow.dt_score !== null ? Number(assRow.dt_score) : undefined
        };
      }
    } catch (assErr) {
      console.warn('[ExerciseRepository] Error fetching assessment for branch routing:', assErr);
    }

    // Resolve exact Month 3 exercise for this user using branch + secondary rules
    const { resolveMonth3Exercise } = await import('../definitions/month3Catalog');
    const month3Resolved = resolveMonth3Exercise(userBranch, assessmentScores);
    const targetMonth3Id = month3Resolved.exerciseId;
    const requiredMonth3Entries = month3Resolved.minEntries;

    // Check completed timestamp of Relationship Map (previous exercise)
    let relMapCompletedAt: string | null = null;
    const relMapInst = deduplicatedMap.get('relationship_map') || deduplicatedMap.get('exercise_5');
    if (relMapInst && relMapInst.status === 'completed') {
      relMapCompletedAt = relMapInst.completed_at || (relMapInst as any).completion_time || relMapInst.updated_at || relMapInst.created_at;
    }

    // Count NEW entries created strictly AFTER Relationship Map completion
    let postRelMapEntryCount = 0;
    if (relMapCompletedAt) {
      try {
        const { count } = await supabase
          .from('entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gt('created_at', relMapCompletedAt);
        postRelMapEntryCount = count || 0;
      } catch (entryErr) {
        console.warn('[ExerciseRepository] Error fetching post-Relationship Map entry count:', entryErr);
      }
    }

    const isMonth3Unlocked = relMapCompletedAt !== null && postRelMapEntryCount >= requiredMonth3Entries;
    const remainingMonth3Entries = Math.max(0, requiredMonth3Entries - postRelMapEntryCount);

    // Map of unlock days per exercise
    const UNLOCK_DAYS: Record<string, number> = {
      exercise_0: 1,
      ocean: 1,
      exercise_1: 9,
      word_association: 9,
      exercise_2: 16,
      inkblot_projective: 16,
      exercise_3: 23,
      self_perception: 23,
      core_values_card_sort: 35,
      core_values: 35,
      exercise_4: 35,
      relationship_map: 42,
      exercise_5: 42,
      avoidance_audit: 91,
      trigger_mapping: 91,
      body_signal_inventory: 91,
      narrative_arc: 91
    };

    // Core exercises list (including the target Month 3 exercise)
    const coreExerciseIds = [
      'exercise_0',
      'exercise_1',
      'exercise_2',
      'exercise_3',
      'core_values_card_sort',
      'relationship_map',
      targetMonth3Id
    ];

    // Canonical alias map to unify deduplicatedMap keys
    const ALIAS_MAP: Record<string, string> = {
      ocean: 'exercise_0',
      word_association: 'exercise_1',
      inkblot_projective: 'exercise_2',
      self_perception: 'exercise_3',
      core_values: 'core_values_card_sort',
      exercise_4: 'core_values_card_sort',
      exercise_5: 'relationship_map'
    };

    // Re-alias deduplicatedMap entries for consistency
    const canonicalMap = new Map<string, ExerciseInstance>();
    for (const [key, inst] of deduplicatedMap.entries()) {
      const canonicalKey = ALIAS_MAP[key] || key;
      const existing = canonicalMap.get(canonicalKey);
      if (!existing || (statusPriority[inst.status] || 0) > (statusPriority[existing.status] || 0)) {
        canonicalMap.set(canonicalKey, { ...inst, exercise_id: canonicalKey });
      }
    }

    // Dynamic unlock status check for existing locked instances
    for (const [reqId, inst] of canonicalMap.entries()) {
      let isUnlocked = false;

      if (reqId === targetMonth3Id) {
        isUnlocked = isMonth3Unlocked;
        if (!isUnlocked && remainingMonth3Entries > 0) {
          inst.metadata = { ...inst.metadata, remaining_entries_needed: remainingMonth3Entries, unlock_label: `${remainingMonth3Entries} more entries needed` };
        }
      } else {
        const requiredDay = UNLOCK_DAYS[reqId] || 1;
        const requiresEntries = reqId === 'relationship_map' || reqId === 'exercise_5' ? 5 : 0;
        isUnlocked = totalUserDays >= requiredDay && (requiresEntries === 0 || userEntryCount >= requiresEntries);
      }

      if (inst.status === 'locked' && isUnlocked) {
        inst.status = 'available';
        inst.unlock_time = new Date().toISOString();
        canonicalMap.set(reqId, inst);
        supabase.from('exercise_instances').update({ status: 'available', unlock_time: inst.unlock_time }).eq('id', inst.id).then();
      }
    }

    // Guarantee ALL core exercises (including target Month 3) exist in canonicalMap
    for (const reqId of coreExerciseIds) {
      if (!canonicalMap.has(reqId)) {
        let isUnlocked = false;
        let remainingNeeded = 0;

        if (reqId === targetMonth3Id) {
          isUnlocked = isMonth3Unlocked;
          remainingNeeded = remainingMonth3Entries;
        } else {
          const unlockDay = UNLOCK_DAYS[reqId] || 1;
          const requiresEntries = reqId === 'relationship_map' || reqId === 'exercise_5' ? 5 : 0;
          isUnlocked = totalUserDays >= unlockDay && (requiresEntries === 0 || userEntryCount >= requiresEntries);
        }

        const isEx0Completed = reqId === 'exercise_0' && hasCompletedBaselineOnboarding;
        const defaultStatus = isEx0Completed ? 'completed' : isUnlocked ? 'available' : 'locked';

        const nowIso = new Date().toISOString();
        const placeholderInst: ExerciseInstance = {
          id: `inst_${reqId}_${userId.slice(0, 8)}`,
          user_id: userId,
          cycle_id: cycleId || undefined,
          exercise_id: reqId,
          status: defaultStatus,
          unlock_time: defaultStatus === 'available' || defaultStatus === 'completed' ? nowIso : null,
          metadata: !isUnlocked && remainingNeeded > 0 ? { remaining_entries_needed: remainingNeeded, unlock_label: `${remainingNeeded} more entries needed` } : undefined,
          created_at: nowIso,
          updated_at: nowIso
        };

        canonicalMap.set(reqId, placeholderInst);

        // Attempt DB insert asynchronously
        try {
          supabase
            .from('exercise_instances')
            .insert({
              user_id: userId,
              cycle_id: cycleId || undefined,
              exercise_id: reqId,
              status: defaultStatus,
              unlock_time: placeholderInst.unlock_time,
              created_at: nowIso,
              updated_at: nowIso
            })
            .select()
            .single()
            .then(({ data: created }) => {
              if (created) canonicalMap.set(reqId, created);
            });
        } catch (e) {
          console.warn(`[ExerciseRepository] DB insert fallback for ${reqId}:`, e);
        }
      }
    }

    // Sort by standard exercise order (Exercises 0 to 7)
    const exerciseOrder = [
      'exercise_0',
      'ocean',
      'exercise_1',
      'word_association',
      'exercise_2',
      'inkblot_projective',
      'exercise_3',
      'self_perception',
      'core_values_card_sort',
      'core_values',
      'exercise_4',
      'relationship_map',
      'exercise_5',
      'avoidance_audit',
      'trigger_mapping',
      'body_signal_inventory',
      'narrative_arc',
      'exercise_6',
      'exercise_7'
    ];
    
    return Array.from(canonicalMap.values()).sort((a, b) => {
      const idxA = exerciseOrder.indexOf(a.exercise_id);
      const idxB = exerciseOrder.indexOf(b.exercise_id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return (a.exercise_id || '').localeCompare(b.exercise_id || '');
    });
  }

  /**
   * Creates an exercise instance, updating existing instance if one already exists for (user_id, exercise_id).
   */
  public static async createInstance(inst: Partial<ExerciseInstance>): Promise<ExerciseInstance> {
    if (inst.user_id && inst.exercise_id) {
      const existing = await this.getInstanceByUserAndExercise(inst.user_id, inst.cycle_id, inst.exercise_id);
      if (existing) {
        console.log(`[ExerciseRepository] Instance already exists for user ${inst.user_id} and exercise ${inst.exercise_id} (ID: ${existing.id}). Returning existing.`);
        return existing;
      }
    }

    const dbPayload = {
      user_id: inst.user_id,
      exercise_id: inst.exercise_id,
      cycle_id: inst.cycle_id,
      status: inst.status || 'locked',
      unlock_time: inst.unlock_time || new Date().toISOString(),
      version: inst.version || 1
    };

    const { data, error } = await supabase
      .from('exercise_instances')
      .insert(dbPayload)
      .select()
      .single();

    if (error) throw new Error(`[ExerciseRepository] createInstance error: ${error.message}`);
    return data;
  }

  public static async updateInstanceStatus(id: string, status: string, extraFields: any = {}): Promise<ExerciseInstance> {
    const now = new Date().toISOString();
    const updatePayload: any = {
      status,
      updated_at: now,
      ...extraFields
    };

    if (status === 'in_progress' || status === 'started') updatePayload.start_time = now;
    if (status === 'completed') updatePayload.completion_time = now;

    const { data, error } = await supabase
      .from('exercise_instances')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`[ExerciseRepository] updateInstanceStatus error: ${error.message}`);
    return data;
  }

  // --- RESPONSES ---
  public static async getResponsesForInstance(instanceId: string): Promise<ExerciseResponse[]> {
    const { data, error } = await supabase
      .from('exercise_responses')
      .select('*')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`[ExerciseRepository] getResponsesForInstance error: ${error.message}`);
    return data || [];
  }

  public static async saveResponse(resp: any): Promise<ExerciseResponse> {
    const qId = resp.question_id || resp.questionId || resp.step_id || 'q1';
    const sId = resp.step_id || resp.stepId || qId;
    const promptText = resp.prompt || '';

    const dbPayload: any = {
      instance_id: resp.instance_id || resp.instanceId,
      user_id: resp.user_id || resp.userId,
      question_id: qId,
      step_id: sId,
      response: String(resp.response !== undefined ? resp.response : ''),
      metadata: resp.metadata || resp.response_metadata || (promptText ? { prompt: promptText } : {})
    };

    const { data, error } = await supabase
      .from('exercise_responses')
      .upsert(dbPayload, { onConflict: 'instance_id,question_id' })
      .select()
      .single();

    if (error) throw new Error(`[ExerciseRepository] saveResponse error: ${error.message}`);
    return data;
  }

  // --- RESULTS ---
  public static async getResultForInstance(instanceId: string): Promise<ExerciseResult | null> {
    const { data, error } = await supabase
      .from('exercise_results')
      .select('*')
      .eq('instance_id', instanceId)
      .maybeSingle();

    if (error) throw new Error(`[ExerciseRepository] getResultForInstance error: ${error.message}`);
    return data;
  }

  public static async saveResult(resData: any): Promise<ExerciseResult> {
    const { data, error } = await supabase
      .from('exercise_results')
      .insert({
        instance_id: resData.instance_id || resData.instanceId,
        user_id: resData.user_id || resData.userId,
        summary: resData.summary,
        analysis: resData.analysis || {},
        score: resData.score,
        model: resData.model || 'v4-ai-engine',
        provider: resData.provider || 'groq',
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`[ExerciseRepository] saveResult error: ${error.message}`);
    return data;
  }

  // --- EVENTS ---
  public static async recordEvent(evt: { instance_id?: string; instanceId?: string; userId: string; eventType: string; payload?: any; eventData?: any }): Promise<ExerciseEvent> {
    const { data, error } = await supabase
      .from('exercise_events')
      .insert({
        instance_id: evt.instance_id || evt.instanceId,
        user_id: evt.userId,
        event_type: evt.eventType,
        payload: evt.payload || evt.eventData || {}
      })
      .select()
      .single();

    if (error) throw new Error(`[ExerciseRepository] recordEvent error: ${error.message}`);
    return data;
  }
}
