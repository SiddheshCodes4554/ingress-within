import { supabase } from '../db';

export interface PatternBackfillStatus {
  user_id: string;
  status: 'NOT_STARTED' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress_total_cycles: number;
  progress_processed_cycles: number;
  progress_total_entries: number;
  progress_processed_entries: number;
  snapshot_created: boolean;
  error_message: string | null;
  queued_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
}

/**
 * Fetches the current pattern engine backfill status for a user.
 * Gracefully returns null if the table does not exist or the query fails.
 */
export async function getBackfillStatus(userId: string): Promise<PatternBackfillStatus | null> {
  try {
    const { data, error } = await supabase
      .from('pattern_backfill_status')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // If table doesn't exist (PGRST116/PGRST204/42P01 code depending on postgrest version)
      if (error.code === '42P01') {
        console.warn(`[Pattern Backfill Status] Table 'pattern_backfill_status' does not exist yet.`);
      } else {
        console.error('[Pattern Backfill Status] Error fetching backfill status:', error.message);
      }
      return null;
    }

    return data as PatternBackfillStatus | null;
  } catch (err: any) {
    console.warn('[Pattern Backfill Status] Exception fetching status:', err.message);
    return null;
  }
}

/**
 * Upserts the backfill status for a user.
 * Gracefully logs warnings if the table does not exist.
 */
export async function updateBackfillStatus(
  userId: string,
  updates: Partial<Omit<PatternBackfillStatus, 'user_id'>>
): Promise<PatternBackfillStatus | null> {
  try {
    const payload = {
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('pattern_backfill_status')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') {
        console.warn(`[Pattern Backfill Status] Cannot update status. Table 'pattern_backfill_status' does not exist. Please run migration.`);
      } else {
        console.error('[Pattern Backfill Status] Error updating status:', error.message);
      }
      return null;
    }

    return data as PatternBackfillStatus | null;
  } catch (err: any) {
    console.warn('[Pattern Backfill Status] Exception updating status:', err.message);
    return null;
  }
}
