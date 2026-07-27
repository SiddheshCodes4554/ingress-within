import { supabase } from '../../../db';
import {
  ExerciseDefinition,
  ExerciseInstance,
  ExerciseResponse,
  ExerciseResult,
  ExerciseEvent,
  ExerciseLifecycleStatus
} from '../types/exercise.types';

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
   * Retrieves user exercise instances, automatically deduplicating by exercise_id.
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

    const { data, error } = await supabase
      .from('exercise_instances')
      .insert({
        user_id: inst.user_id,
        exercise_id: inst.exercise_id,
        cycle_id: inst.cycle_id,
        status: inst.status || 'locked',
        unlock_time: inst.unlock_time || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`[ExerciseRepository] createInstance error: ${error.message}`);
    return data;
  }

  public static async updateInstanceStatus(
    id: string,
    status: ExerciseLifecycleStatus,
    extraFields?: Partial<ExerciseInstance>
  ): Promise<ExerciseInstance> {
    const { data, error } = await supabase
      .from('exercise_instances')
      .update({
        status,
        ...extraFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`[ExerciseRepository] updateInstanceStatus error: ${error.message}`);
    return data;
  }

  // --- EVENTS ---
  public static async recordEvent(event: any): Promise<any> {
    const { data, error } = await supabase
      .from('exercise_events')
      .insert({
        instance_id: event.instance_id,
        user_id: event.user_id,
        event_type: event.event_type,
        metadata: event.metadata || {},
        created_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    if (error) console.warn('[ExerciseRepository] recordEvent warning:', error.message);
    return data || null;
  }

  // --- RESPONSES ---
  public static async saveResponse(response: ExerciseResponse): Promise<ExerciseResponse> {
    const { data, error } = await supabase
      .from('exercise_responses')
      .upsert(
        {
          instance_id: response.instance_id,
          user_id: response.user_id,
          question_id: response.question_id,
          prompt: (response as any).prompt || '',
          response: response.response,
          metadata: (response as any).metadata || {},
          updated_at: new Date().toISOString()
        },
        { onConflict: 'instance_id,question_id' }
      )
      .select()
      .single();

    if (error) throw new Error(`[ExerciseRepository] saveResponse error: ${error.message}`);
    return data;
  }

  public static async getResponses(instanceId: string): Promise<ExerciseResponse[]> {
    const { data, error } = await supabase
      .from('exercise_responses')
      .select('*')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`[ExerciseRepository] getResponses error: ${error.message}`);
    return data || [];
  }

  public static async getResponsesForInstance(instanceId: string): Promise<ExerciseResponse[]> {
    return this.getResponses(instanceId);
  }

  // --- RESULTS ---
  public static async saveResult(result: Partial<ExerciseResult>): Promise<ExerciseResult> {
    const { data, error } = await supabase
      .from('exercise_results')
      .upsert(
        {
          instance_id: result.instance_id,
          user_id: result.user_id,
          summary: result.summary,
          analysis: result.analysis,
          model: (result as any).model || null,
          provider: (result as any).provider || null,
          raw_json: (result as any).raw_json || null,
          generated_at: new Date().toISOString()
        },
        { onConflict: 'instance_id' }
      )
      .select()
      .single();

    if (error) throw new Error(`[ExerciseRepository] saveResult error: ${error.message}`);
    return data;
  }

  public static async getResult(instanceId: string): Promise<ExerciseResult | null> {
    const { data, error } = await supabase
      .from('exercise_results')
      .select('*')
      .eq('instance_id', instanceId)
      .maybeSingle();

    if (error) throw new Error(`[ExerciseRepository] getResult error: ${error.message}`);
    return data;
  }

  public static async getResultForInstance(instanceId: string): Promise<ExerciseResult | null> {
    return this.getResult(instanceId);
  }
}
