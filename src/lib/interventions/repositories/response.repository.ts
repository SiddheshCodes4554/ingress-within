import { supabase } from '../../db';
import { InterventionResponse } from '../types/intervention';

export class ResponseRepository {
  private static memoryResponses: InterventionResponse[] = [];

  /**
   * Stores intervention reflection responses.
   * STRICT GUARDRAIL: These responses are STORED ONLY. They are NEVER sent to AI or analyzed.
   */
  async storeResponses(sessionId: string, responses: Array<{ question_id: string; answer: string }>): Promise<InterventionResponse[]> {
    if (!responses || responses.length === 0) return [];

    const now = new Date().toISOString();
    const rows = responses.map((r) => ({
      session_id: sessionId,
      question_id: r.question_id,
      answer: r.answer,
      created_at: now,
    }));

    try {
      const { data, error } = await supabase
        .from('intervention_responses')
        .insert(rows)
        .select('*');

      if (!error && data) {
        return data as InterventionResponse[];
      }
    } catch (e) {
      console.warn('[ResponseRepository] DB storeResponses fallback:', e);
    }

    const inserted: InterventionResponse[] = rows.map((r) => ({
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...r,
    }));

    ResponseRepository.memoryResponses.push(...inserted);
    return inserted;
  }

  /**
   * Fetches responses for a given session.
   */
  async findBySessionId(sessionId: string): Promise<InterventionResponse[]> {
    try {
      const { data, error } = await supabase
        .from('intervention_responses')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        return data as InterventionResponse[];
      }
    } catch (e) {
      console.warn('[ResponseRepository] DB findBySessionId fallback:', e);
    }

    return ResponseRepository.memoryResponses.filter((r) => r.session_id === sessionId);
  }
}
