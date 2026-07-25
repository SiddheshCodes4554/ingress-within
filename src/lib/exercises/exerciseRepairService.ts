import { supabase } from '../db';
import { ExerciseStateMachine } from './exerciseStateMachine';
import { ExerciseQueueProcessor } from './exerciseQueueProcessor';

export interface RepairDiagnosticSummary {
  scannedCount: number;
  repairedCount: number;
  details: string[];
}

export class ExerciseRepairService {
  /**
   * Automated self-healing repair sweep for exercise subsystem records.
   */
  public static async runRepairSweep(userId?: string): Promise<RepairDiagnosticSummary> {
    console.log(`[RepairService] Starting repair sweep${userId ? ` for user ${userId}` : ''}...`);

    let query = supabase.from('exercise_instances').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: instances, error } = await query;
    if (error || !instances) {
      console.error('[RepairService] Failed to fetch instances for repair:', error?.message);
      return { scannedCount: 0, repairedCount: 0, details: [`Error: ${error?.message}`] };
    }

    let repairedCount = 0;
    const details: string[] = [];

    for (const inst of instances) {
      let isRepaired = false;

      // 1. Check: Analysis exists in exercise_analysis or exercise_results but status is incorrect
      const { data: analysis } = await supabase
        .from('exercise_analysis')
        .select('id')
        .eq('instance_id', inst.id)
        .maybeSingle();

      const { data: legacyResult } = analysis ? { data: null } : await supabase
        .from('exercise_results')
        .select('id')
        .eq('instance_id', inst.id)
        .maybeSingle();

      const hasStoredAnalysis = !!(analysis || legacyResult);

      if (hasStoredAnalysis && inst.status !== 'result_available' && inst.status !== 'completed' && inst.status !== 'archived') {
        await ExerciseStateMachine.transition(inst.user_id, inst.id, 'result_available', {
          force: true,
          reason: 'Repair: Analysis exists but status was incorrect.'
        });
        details.push(`Instance ${inst.id}: Fixed status to result_available (analysis exists)`);
        isRepaired = true;
      }

      // 2. Check: Status is submitted but not queued
      if (!hasStoredAnalysis && inst.status === 'submitted') {
        await ExerciseQueueProcessor.processInstanceJob(inst.id);
        details.push(`Instance ${inst.id}: Enqueued/processed job for submitted instance`);
        isRepaired = true;
      }

      // 3. Check: Queued or Processing but stalled (> 120s)
      if (!hasStoredAnalysis && (inst.status === 'queued' || inst.status === 'processing')) {
        const updatedAt = new Date(inst.updated_at || inst.created_at).getTime();
        const stalledMs = Date.now() - updatedAt;

        if (stalledMs > 120000) {
          console.log(`[RepairService] Instance ${inst.id} stalled in state ${inst.status} for ${stalledMs}ms. Retrying...`);
          await ExerciseQueueProcessor.processInstanceJob(inst.id);
          details.push(`Instance ${inst.id}: Re-processed stalled job in state ${inst.status}`);
          isRepaired = true;
        }
      }

      // 4. Check: Status is completed or finished but no stored analysis
      if (!hasStoredAnalysis && (inst.status === 'completed' || inst.status === 'finished')) {
        console.log(`[RepairService] Instance ${inst.id} marked completed without analysis. Generating analysis...`);
        await ExerciseQueueProcessor.processInstanceJob(inst.id);
        details.push(`Instance ${inst.id}: Generated missing analysis for completed instance`);
        isRepaired = true;
      }

      if (isRepaired) {
        repairedCount++;
      }
    }

    console.log(`[RepairService] Repair sweep complete. Scanned: ${instances.length}, Repaired: ${repairedCount}`);
    return {
      scannedCount: instances.length,
      repairedCount,
      details
    };
  }
}
