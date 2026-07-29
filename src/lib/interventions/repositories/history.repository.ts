import { supabase } from '../../db';
import { InterventionHistory } from '../types/intervention';
import { PaginatedResult, PaginationParams } from '../types/dto';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../constants/defaults';
import { InterventionRepository } from './intervention.repository';

export class HistoryRepository {
  private static memoryHistory: InterventionHistory[] = [];

  /**
   * Logs an opened session event in intervention_history.
   */
  async logOpen(userId: string, interventionId: string, sessionId?: string): Promise<InterventionHistory> {
    const now = new Date().toISOString();
    const entry: Partial<InterventionHistory> = {
      user_id: userId,
      intervention_id: interventionId,
      session_id: sessionId || null,
      started_at: now,
      duration: 0,
      completion_state: 'in_progress',
    };

    try {
      const { data, error } = await supabase
        .from('intervention_history')
        .insert([entry])
        .select('*')
        .single();

      if (!error && data) {
        return data as InterventionHistory;
      }
    } catch (e) {
      console.warn('[HistoryRepository] DB logOpen fallback:', e);
    }

    const memoryEntry: InterventionHistory = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: userId,
      intervention_id: interventionId,
      session_id: sessionId || null,
      started_at: now,
      duration: 0,
      completion_state: 'in_progress',
    };

    HistoryRepository.memoryHistory.push(memoryEntry);
    return memoryEntry;
  }

  /**
   * Updates completion timestamp and duration for a session history record.
   */
  async logCompletion(userId: string, sessionId: string, timeSpentSeconds: number): Promise<boolean> {
    const now = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('intervention_history')
        .update({ completed_at: now, duration: timeSpentSeconds, completion_state: 'completed' })
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      if (!error) return true;
    } catch (e) {
      console.warn('[HistoryRepository] DB logCompletion fallback:', e);
    }

    const match = HistoryRepository.memoryHistory.find((h) => h.session_id === sessionId && h.user_id === userId);
    if (match) {
      match.completed_at = now;
      match.duration = timeSpentSeconds;
      match.completion_state = 'completed';
      return true;
    }
    return false;
  }

  /**
   * Fetches user's history with pagination and joined intervention data.
   */
  async getUserHistory(userId: string, params: PaginationParams): Promise<PaginatedResult<InterventionHistory>> {
    const page = params.page || DEFAULT_PAGE;
    const limit = params.limit || DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    const interventionRepo = new InterventionRepository();

    try {
      const { data, count, error } = await supabase
        .from('intervention_history')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!error && data) {
        const total = count || data.length;

        // Populate intervention metadata for each history entry
        const enriched = await Promise.all(
          data.map(async (item) => {
            const intervention = await interventionRepo.findByIdOrSlug(item.intervention_id);
            return {
              ...item,
              intervention: intervention || undefined,
            } as InterventionHistory;
          })
        );

        return {
          data: enriched,
          pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit) || 1,
            has_more: offset + data.length < total,
          },
        };
      }
    } catch (e) {
      console.warn('[HistoryRepository] DB getUserHistory fallback:', e);
    }

    // In-memory fallback
    const userHistory = HistoryRepository.memoryHistory
      .filter((h) => h.user_id === userId)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

    const total = userHistory.length;
    const paginated = userHistory.slice(offset, offset + limit);

    const enriched = await Promise.all(
      paginated.map(async (item) => {
        const intervention = await interventionRepo.findByIdOrSlug(item.intervention_id);
        return {
          ...item,
          intervention: intervention || undefined,
        };
      })
    );

    return {
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
        has_more: offset + paginated.length < total,
      },
    };
  }

  /**
   * Fetches recently used intervention IDs for a user.
   */
  async getRecentlyUsed(userId: string, limitCount = 5): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('intervention_history')
        .select('intervention_id')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limitCount * 2);

      if (!error && data) {
        const uniqueIds = Array.from(new Set(data.map((d) => d.intervention_id))).slice(0, limitCount);
        return uniqueIds;
      }
    } catch (e) {
      console.warn('[HistoryRepository] DB getRecentlyUsed fallback:', e);
    }

    const userHistory = HistoryRepository.memoryHistory
      .filter((h) => h.user_id === userId)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

    const uniqueIds = Array.from(new Set(userHistory.map((h) => h.intervention_id))).slice(0, limitCount);
    return uniqueIds;
  }
}
