import { supabase } from '../../db';
import { InterventionSession, SessionStatus } from '../types/intervention';

export class SessionRepository {
  /**
   * In-memory storage fallback for testing/environments where DB schema hasn't migrated yet.
   */
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
      last_position: 0,
      elapsed_seconds: 0,
      responses: {},
      created_at: now,
      updated_at: now,
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

    // Fallback to memory session
    const id = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const sessionObj: InterventionSession = {
      id,
      user_id: userId,
      intervention_id: interventionId,
      status: 'in_progress',
      started_at: now,
      last_position: 0,
      elapsed_seconds: 0,
      responses: {},
      created_at: now,
      updated_at: now,
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
        .is('deleted_at', null)
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
        sess.status === 'in_progress' &&
        !sess.deleted_at
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
        .is('deleted_at', null)
        .maybeSingle();

      if (!error && data) {
        return data as InterventionSession;
      }
    } catch (e) {
      console.warn('[SessionRepository] DB findById fallback:', e);
    }

    const sess = SessionRepository.memorySessions.get(sessionId);
    if (sess && sess.user_id === userId && !sess.deleted_at) {
      return sess;
    }
    return null;
  }

  /**
   * Updates session position, elapsed seconds, or status.
   */
  async updateSession(
    userId: string,
    sessionId: string,
    updates: Partial<Pick<InterventionSession, 'status' | 'completed_at' | 'last_position' | 'elapsed_seconds' | 'responses'>>
  ): Promise<InterventionSession | null> {
    const updatedPayload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('intervention_sessions')
        .update(updatedPayload)
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
      Object.assign(sess, updatedPayload);
      return sess;
    }
    return null;
  }
}
