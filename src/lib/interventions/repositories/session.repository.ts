import { supabase } from '../../db';
import { InterventionSession } from '../types/intervention';

export class SessionRepository {
  private static memorySessions: Map<string, InterventionSession> = new Map();

  /**
   * Creates a new session scoped to a user.
   */
  async createSession(userId: string, interventionId: string): Promise<InterventionSession> {
    const now = new Date().toISOString();
    const newSession: Partial<InterventionSession> = {
      user_id: userId,
      intervention_id: interventionId,
      status: 'in_progress',
      started_at: now,
      last_step: 0,
      elapsed_seconds: 0,
    };

    try {
      const { data, error } = await supabase
        .from('intervention_sessions')
        .insert([newSession])
        .select('*')
        .single();

      if (!error && data) {
        return data as InterventionSession;
      }
    } catch (e) {
      console.warn('[SessionRepository] DB create session fallback:', e);
    }

    const id = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const sessionObj: InterventionSession = {
      id,
      user_id: userId,
      intervention_id: interventionId,
      status: 'in_progress',
      started_at: now,
      last_step: 0,
      elapsed_seconds: 0,
    };

    SessionRepository.memorySessions.set(id, sessionObj);
    return sessionObj;
  }

  /**
   * Finds an active in-progress session for a user and intervention.
   */
  async findActiveSession(userId: string, interventionId: string): Promise<InterventionSession | null> {
    try {
      const { data, error } = await supabase
        .from('intervention_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('intervention_id', interventionId)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data as InterventionSession;
      }
    } catch (e) {
      console.warn('[SessionRepository] DB find active session fallback:', e);
    }

    for (const sess of SessionRepository.memorySessions.values()) {
      if (
        sess.user_id === userId &&
        sess.intervention_id === interventionId &&
        sess.status === 'in_progress'
      ) {
        return sess;
      }
    }
    return null;
  }

  /**
   * Finds a session by ID scoped strictly to user_id.
   */
  async findById(userId: string, sessionId: string): Promise<InterventionSession | null> {
    try {
      const { data, error } = await supabase
        .from('intervention_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return data as InterventionSession;
      }
    } catch (e) {
      console.warn('[SessionRepository] DB findById fallback:', e);
    }

    const sess = SessionRepository.memorySessions.get(sessionId);
    if (sess && sess.user_id === userId) {
      return sess;
    }
    return null;
  }

  /**
   * Updates session step, elapsed seconds, or status.
   */
  async updateSession(
    userId: string,
    sessionId: string,
    updates: Partial<Pick<InterventionSession, 'status' | 'completed_at' | 'last_step' | 'elapsed_seconds'>>
  ): Promise<InterventionSession | null> {
    try {
      const { data, error } = await supabase
        .from('intervention_sessions')
        .update(updates)
        .eq('id', sessionId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (!error && data) {
        return data as InterventionSession;
      }
    } catch (e) {
      console.warn('[SessionRepository] DB updateSession fallback:', e);
    }

    const sess = SessionRepository.memorySessions.get(sessionId);
    if (sess && sess.user_id === userId) {
      Object.assign(sess, updates);
      return sess;
    }
    return null;
  }
}
