import { supabase } from '../db';

export interface ResultPayload {
  instance_id: string;
  user_id: string;
  analysis: string;
  scores: any;
  branch: string | null;
  lens: string | null;
  gap_score: number | null;
  summary: string;
  provider: string;
  model: string;
  prompt_version: string;
  engine_version: string;
  raw_json: any;
}

export class ExerciseResultStorage {
  /**
   * Immutable Result Storage.
   * Inserts a new result record into the exercise_results table.
   * Never deletes or overwrites prior evaluations to maintain historical audits.
   */
  public static async save(payload: ResultPayload): Promise<any> {
    console.log(`[ResultStorage] Saving immutable result version for instance ${payload.instance_id}`);

    const insertData: any = {
      instance_id: payload.instance_id,
      user_id: payload.user_id,
      analysis: payload.analysis,
      scores: payload.scores,
      branch: payload.branch,
      lens: payload.lens,
      gap_score: payload.gap_score,
      summary: payload.summary,
      provider: payload.provider,
      model: payload.model,
      generated_at: new Date().toISOString()
    };

    // Safely check schema definitions and add optional columns to avoid breaking older schemas
    // But since we are adding them in Phase 3 migration, we store them.
    try {
      insertData.prompt_version = payload.prompt_version;
      insertData.engine_version = payload.engine_version;
      insertData.raw_json = payload.raw_json;
    } catch (err: any) {
      console.warn('[ResultStorage] Could not attach Phase 3 columns, falling back to core schema fields only.', err.message);
    }

    const { data: saved, error } = await supabase
      .from('exercise_results')
      .insert(insertData)
      .select()
      .single();

    if (error || !saved) {
      throw new Error(`Failed to store result record: ${error?.message}`);
    }

    return saved;
  }
}
