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
   * Retrieves user exercise instances, automatically deduplicating by exercise_id
   * and auto-creating missing core exercises (0, 1, 2, 3) as available.
   */
  public static async getUserInstances(userId: string, cycleId?: string): Promise<ExerciseInstance[]> {
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

    // Ensure all 4 core exercises exist for the user
    const coreExerciseIds = ['exercise_0', 'exercise_1', 'exercise_2', 'exercise_3'];
    for (const reqId of coreExerciseIds) {
      if (!deduplicatedMap.has(reqId)) {
        try {
          const { data: newInst } = await supabase
            .from('exercise_instances')
            .insert({
              user_id: userId,
              exercise_id: reqId,
              status: 'available',
              unlock_time: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (newInst) {
            deduplicatedMap.set(reqId, newInst);
          }
        } catch (e) {
          console.warn(`[ExerciseRepository] Failed to auto-create missing ${reqId} for ${userId}`, e);
        }
      }
    }

    // Sort by standard exercise order (exercise_0, exercise_1, exercise_2, exercise_3)
    const exerciseOrder = ['exercise_0', 'ocean', 'exercise_1', 'word_association', 'exercise_2', 'inkblot_projective', 'exercise_3', 'self_perception'];
    
    return Array.from(deduplicatedMap.values()).sort((a, b) => {
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
      .order('updated_at', { ascending: true });

    if (error) throw new Error(`[ExerciseRepository] getResponsesForInstance error: ${error.message}`);
    return data || [];
  }

  public static async saveResponse(resp: any): Promise<ExerciseResponse> {
    const { data, error } = await supabase
      .from('exercise_responses')
      .upsert({
        instance_id: resp.instance_id || resp.instanceId,
        user_id: resp.user_id || resp.userId,
        question_id: resp.question_id || resp.questionId,
        prompt: resp.prompt || '',
        response: resp.response,
        response_metadata: resp.response_metadata || resp.metadata || {},
        updated_at: new Date().toISOString()
      })
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
        event_data: evt.payload || evt.eventData || {}
      })
      .select()
      .single();

    if (error) throw new Error(`[ExerciseRepository] recordEvent error: ${error.message}`);
    return data;
  }
}
