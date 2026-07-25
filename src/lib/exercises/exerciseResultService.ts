import { supabase } from '../db';

export interface ExerciseResultPayload {
  success: boolean;
  result?: any;
  instance?: any;
  instanceStatus?: string;
  isProcessing?: boolean;
  isFailed?: boolean;
  isMissing?: boolean;
  error?: string;
}

export class ExerciseResultService {
  /**
   * Dedicated Result Service (Phase 7).
   * Reads ONLY from exercise_results. Never recomputes or regenerates AI.
   */
  public static async getResult(userId: string, rawId: string): Promise<ExerciseResultPayload> {
    if (!userId || !rawId) {
      return { success: false, isMissing: true, error: 'Missing userId or instance ID.' };
    }

    let targetInstanceId = rawId;

    // 1. If rawId is an exercise_id (e.g. exercise_1), resolve instance_id from active cycle
    if (rawId.startsWith('exercise_') || rawId.startsWith('cbt_')) {
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (activeCycle) {
        const { data: inst } = await supabase
          .from('exercise_instances')
          .select('id, status')
          .eq('user_id', userId)
          .eq('cycle_id', activeCycle.id)
          .eq('exercise_id', rawId)
          .maybeSingle();

        if (inst) {
          targetInstanceId = inst.id;
        }
      }
    }

    // 2. Query exercise_results table directly (latest immutable version)
    const { data: result, error: resErr } = await supabase
      .from('exercise_results')
      .select('*')
      .eq('instance_id', targetInstanceId)
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resErr) {
      console.error('[ResultService] Database error fetching exercise_results:', resErr.message);
    }

    if (result) {
      return {
        success: true,
        result,
        instanceStatus: 'finished'
      };
    }

    // 3. Result not found yet — check exercise_instances state to provide precise status
    const { data: instance } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('id', targetInstanceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (instance) {
      if (['completed', 'queued', 'analysing'].includes(instance.status)) {
        return {
          success: false,
          instance,
          instanceStatus: instance.status,
          isProcessing: true
        };
      }
      if (instance.status === 'failed') {
        return {
          success: false,
          instance,
          instanceStatus: 'failed',
          isFailed: true
        };
      }
    }

    return {
      success: false,
      instance: instance || null,
      instanceStatus: instance?.status || 'unknown',
      isMissing: true
    };
  }
}
