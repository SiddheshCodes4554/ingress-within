export type SessionLifecycleState =
  | 'not_started'
  | 'available'
  | 'started'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'abandoned';

export class SessionStateMachine {
  private static VALID_TRANSITIONS: Record<SessionLifecycleState, SessionLifecycleState[]> = {
    not_started: ['available', 'started'],
    available: ['started', 'abandoned'],
    started: ['in_progress', 'paused', 'abandoned'],
    in_progress: ['paused', 'completed', 'abandoned'],
    paused: ['in_progress', 'completed', 'abandoned'],
    completed: [], // Terminal state
    abandoned: [], // Terminal state
  };

  /**
   * Validates if a state transition from `current` to `target` is allowed.
   */
  static canTransition(current: SessionLifecycleState, target: SessionLifecycleState): boolean {
    if (current === target) return true; // Idempotent same-state check
    const allowed = this.VALID_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  /**
   * Asserts state transition or throws error if transition is invalid.
   */
  static validateTransition(current: SessionLifecycleState, target: SessionLifecycleState): void {
    if (!this.canTransition(current, target)) {
      throw new Error(
        `Invalid Session State Transition: Cannot transition from '${current}' to '${target}'. Invariant violated.`
      );
    }
  }

  /**
   * Computes progression state.
   */
  static isTerminalState(state: SessionLifecycleState): boolean {
    return state === 'completed' || state === 'abandoned';
  }
}
