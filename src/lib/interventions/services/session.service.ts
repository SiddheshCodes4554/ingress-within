import { SessionRepository } from '../repositories/session.repository';
import { InterventionRepository } from '../repositories/intervention.repository';
import { ResponseRepository } from '../repositories/response.repository';
import { HistoryRepository } from '../repositories/history.repository';
import { SessionStateMachine, SessionLifecycleState } from '../engine/session/state-machine';
import { StepEngine } from '../engine/session/step-engine';
import { InterventionSession, InterventionResponse } from '../types/intervention';
import { InterventionStep, SessionProgress } from '../types/step';

export interface SessionDetailResponse {
  session: InterventionSession;
  intervention_id: string;
  steps: InterventionStep[];
  current_step_details: InterventionStep;
  progress: SessionProgress;
  responses: InterventionResponse[];
}

export class InterventionSessionService {
  private sessionRepo: SessionRepository;
  private interventionRepo: InterventionRepository;
  private responseRepo: ResponseRepository;
  private historyRepo: HistoryRepository;

  constructor(
    sessionRepo?: SessionRepository,
    interventionRepo?: InterventionRepository,
    responseRepo?: ResponseRepository,
    historyRepo?: HistoryRepository
  ) {
    this.sessionRepo = sessionRepo || new SessionRepository();
    this.interventionRepo = interventionRepo || new InterventionRepository();
    this.responseRepo = responseRepo || new ResponseRepository();
    this.historyRepo = historyRepo || new HistoryRepository();
  }

  /**
   * 1. startSession(userId, interventionId)
   * Starts a new session or returns an active in-progress session.
   * Lifecycle transition: not_started -> available -> started -> in_progress
   */
  async startSession(userId: string, interventionId: string): Promise<SessionDetailResponse> {
    const intervention = await this.interventionRepo.findByIdOrSlug(interventionId);
    if (!intervention) throw new Error(`Intervention not found: ${interventionId}`);

    let session = await this.sessionRepo.findActiveSession(userId, intervention.id);

    if (!session) {
      session = await this.sessionRepo.createSession(userId, intervention.id);
    }

    // Enforce state transition available -> started -> in_progress
    const current = (session.status as SessionLifecycleState) || 'not_started';
    if (current === 'not_started' || current === 'available') {
      SessionStateMachine.validateTransition(current, 'started');
      SessionStateMachine.validateTransition('started', 'in_progress');
      session = (await this.sessionRepo.updateSession(userId, session.id, {
        status: 'in_progress',
        last_step: session.last_step || 1,
      })) || session;
    }

    await this.historyRepo.logOpen(userId, intervention.id, session.id);
    return this.getSessionState(userId, session.id);
  }

  /**
   * 2. resumeSession(userId, sessionId)
   * Restores session state, timer, and current step.
   * Lifecycle transition: paused -> in_progress
   */
  async resumeSession(userId: string, sessionId: string): Promise<SessionDetailResponse> {
    const session = await this.sessionRepo.findById(userId, sessionId);
    if (!session) throw new Error(`Session not found or unauthorized: ${sessionId}`);

    const current = (session.status as SessionLifecycleState) || 'in_progress';
    if (current === 'paused') {
      SessionStateMachine.validateTransition('paused', 'in_progress');
      await this.sessionRepo.updateSession(userId, sessionId, {
        status: 'in_progress',
      });
    }

    return this.getSessionState(userId, sessionId);
  }

  /**
   * 3. pauseSession(userId, sessionId, elapsedSeconds?)
   * Pauses an active session and saves elapsed time.
   * Lifecycle transition: in_progress -> paused
   */
  async pauseSession(userId: string, sessionId: string, elapsedSeconds?: number): Promise<InterventionSession> {
    const session = await this.sessionRepo.findById(userId, sessionId);
    if (!session) throw new Error(`Session not found or unauthorized: ${sessionId}`);

    const current = (session.status as SessionLifecycleState) || 'in_progress';
    SessionStateMachine.validateTransition(current, 'paused');

    const totalElapsed = elapsedSeconds !== undefined ? elapsedSeconds : session.elapsed_seconds || 0;

    const updated = await this.sessionRepo.updateSession(userId, sessionId, {
      status: 'paused',
      elapsed_seconds: totalElapsed,
    });

    if (!updated) throw new Error('Failed to pause session');
    return updated;
  }

  /**
   * 4. nextStep(userId, sessionId, payload?)
   * Advances step, stores step answer if provided (STORED ONLY - ZERO AI), and autosaves progress.
   */
  async nextStep(
    userId: string,
    sessionId: string,
    payload?: { question_id?: string; answer?: string; elapsed_seconds?: number }
  ): Promise<SessionDetailResponse> {
    const session = await this.sessionRepo.findById(userId, sessionId);
    if (!session) throw new Error(`Session not found or unauthorized: ${sessionId}`);

    const intervention = await this.interventionRepo.findByIdOrSlug(session.intervention_id);
    if (!intervention) throw new Error(`Intervention not found for session: ${session.id}`);

    const parsedSteps = StepEngine.parseSteps(intervention);
    const currentStepNum = session.last_step || 1;
    const nextStepNum = Math.min(parsedSteps.length, currentStepNum + 1);

    // Save answer if question answered (STORED ONLY)
    if (payload?.question_id && payload?.answer) {
      await this.responseRepo.storeResponses(sessionId, [
        { question_id: payload.question_id, answer: payload.answer },
      ]);
    }

    const elapsed = payload?.elapsed_seconds !== undefined ? payload.elapsed_seconds : session.elapsed_seconds || 0;

    // Autosave progress
    await this.sessionRepo.updateSession(userId, sessionId, {
      last_step: nextStepNum,
      elapsed_seconds: elapsed,
      status: 'in_progress',
    });

    return this.getSessionState(userId, sessionId);
  }

  /**
   * 5. previousStep(userId, sessionId)
   * Navigates to previous step if intervention allows (allow_previous = true).
   */
  async previousStep(userId: string, sessionId: string): Promise<SessionDetailResponse> {
    const session = await this.sessionRepo.findById(userId, sessionId);
    if (!session) throw new Error(`Session not found or unauthorized: ${sessionId}`);

    const intervention = await this.interventionRepo.findByIdOrSlug(session.intervention_id);
    if (!intervention) throw new Error(`Intervention not found for session: ${session.id}`);

    const parsedSteps = StepEngine.parseSteps(intervention);
    const currentStepNum = session.last_step || 1;

    if (!StepEngine.canMovePrevious(parsedSteps, currentStepNum)) {
      throw new Error(`Previous step not allowed for current step ${currentStepNum}`);
    }

    const prevStepNum = Math.max(1, currentStepNum - 1);

    await this.sessionRepo.updateSession(userId, sessionId, {
      last_step: prevStepNum,
      status: 'in_progress',
    });

    return this.getSessionState(userId, sessionId);
  }

  /**
   * 6. completeSession(userId, sessionId, responses?)
   * Lifecycle transition: in_progress / paused -> completed
   * Updates InterventionHistory and stores final responses. ZERO AI / ZERO Queue.
   */
  async completeSession(
    userId: string,
    sessionId: string,
    payload?: { elapsed_seconds?: number; responses?: Array<{ question_id: string; answer: string }> }
  ): Promise<InterventionSession> {
    const session = await this.sessionRepo.findById(userId, sessionId);
    if (!session) throw new Error(`Session not found or unauthorized: ${sessionId}`);

    const current = (session.status as SessionLifecycleState) || 'in_progress';
    SessionStateMachine.validateTransition(current, 'completed');

    const now = new Date().toISOString();
    const elapsed = payload?.elapsed_seconds !== undefined ? payload.elapsed_seconds : session.elapsed_seconds || 0;

    const updated = await this.sessionRepo.updateSession(userId, sessionId, {
      status: 'completed',
      completed_at: now,
      elapsed_seconds: elapsed,
    });

    if (!updated) throw new Error('Failed to complete session');

    // Store responses (STORED ONLY - ZERO AI)
    if (payload?.responses && payload.responses.length > 0) {
      await this.responseRepo.storeResponses(sessionId, payload.responses);
    }

    // Update history record
    await this.historyRepo.logCompletion(userId, sessionId, elapsed);

    return updated;
  }

  /**
   * 7. abandonSession(userId, sessionId)
   * Lifecycle transition: in_progress / paused -> abandoned
   */
  async abandonSession(userId: string, sessionId: string): Promise<InterventionSession> {
    const session = await this.sessionRepo.findById(userId, sessionId);
    if (!session) throw new Error(`Session not found or unauthorized: ${sessionId}`);

    const current = (session.status as SessionLifecycleState) || 'in_progress';
    SessionStateMachine.validateTransition(current, 'abandoned');

    const updated = await this.sessionRepo.updateSession(userId, sessionId, {
      status: 'abandoned',
    });

    if (!updated) throw new Error('Failed to abandon session');
    return updated;
  }

  /**
   * 8. getSessionState(userId, sessionId)
   * Fetches current session details, steps, progress, and saved responses.
   */
  async getSessionState(userId: string, sessionId: string): Promise<SessionDetailResponse> {
    const session = await this.sessionRepo.findById(userId, sessionId);
    if (!session) throw new Error(`Session not found or unauthorized: ${sessionId}`);

    const intervention = await this.interventionRepo.findByIdOrSlug(session.intervention_id);
    if (!intervention) throw new Error(`Intervention not found: ${session.intervention_id}`);

    const parsedSteps = StepEngine.parseSteps(intervention);
    const currentStepNum = Math.min(parsedSteps.length, Math.max(1, session.last_step || 1));
    const currentStepDetails = parsedSteps[currentStepNum - 1] || parsedSteps[0];

    const responses = await this.responseRepo.findBySessionId(sessionId);
    const progress = StepEngine.calculateProgress(currentStepNum, parsedSteps.length, session.elapsed_seconds || 0);

    return {
      session,
      intervention_id: intervention.id,
      steps: parsedSteps,
      current_step_details: currentStepDetails,
      progress,
      responses,
    };
  }
}
