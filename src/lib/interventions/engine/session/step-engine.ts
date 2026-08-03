import { InterventionStep, SessionProgress, StepType } from '../../types/step';
import { Intervention } from '../../types/intervention';

export class StepEngine {
  /**
   * Normalizes raw intervention steps into structured InterventionStep objects.
   */
  static parseSteps(intervention: Intervention): InterventionStep[] {
    const rawSteps = intervention.steps || [];
    const questions = intervention.questions || [];
    const totalDurationMinutes = intervention.estimated_duration || intervention.duration_minutes || (intervention as any).duration || 5;
    const defaultStepDurationSeconds = Math.ceil((totalDurationMinutes * 60) / Math.max(1, rawSteps.length));

    const needsResponse = (text: string, title?: string) => {
      const fullText = `${title || ''} ${text || ''}`;
      if (fullText.includes('?')) return true;
      return /\b(write|jot down|list|note|log|identify|ask|reflect|describe|name|pick|draft|record)\b/i.test(fullText);
    };

    return rawSteps.map((stepItem, index) => {
      const stepNumber = index + 1;
      const questionForStep = questions.find((q) => q.step_index === index || q.step_index === stepNumber);

      if (typeof stepItem === 'string') {
        const isWriteStep = !!questionForStep || needsResponse(stepItem);
        const qObj = questionForStep || (isWriteStep ? { id: `q_${intervention.id}_step_${stepNumber}`, prompt: stepItem, type: 'text' } : undefined);
        return {
          step_id: `step_${intervention.id}_${stepNumber}`,
          step_number: stepNumber,
          step_type: isWriteStep ? 'reflection' : 'instruction',
          title: `Step ${stepNumber}`,
          content: stepItem,
          optional_question: qObj,
          estimated_duration: defaultStepDurationSeconds,
          allow_previous: true,
          auto_advance: false,
        };
      }

      // Pre-structured step object
      const s = stepItem as any;
      const stepContent = s.content || s.instruction || '';
      const isWriteStep = s.step_type === 'reflection' || s.step_type === 'text' || !!s.optional_question || !!questionForStep || needsResponse(stepContent, s.title);
      const qObj = s.optional_question || questionForStep || (isWriteStep ? { id: `q_${intervention.id}_step_${stepNumber}`, prompt: stepContent || s.title || '', type: 'text' } : undefined);

      return {
        step_id: s.step_id || `step_${intervention.id}_${stepNumber}`,
        step_number: stepNumber,
        step_type: isWriteStep ? (s.step_type || 'reflection') : (s.step_type || 'instruction'),
        title: s.title || `Step ${stepNumber}`,
        content: stepContent,
        optional_question: qObj,
        optional_media: s.optional_media,
        items: s.items,
        estimated_duration: s.estimated_duration || defaultStepDurationSeconds,
        allow_previous: s.allow_previous !== undefined ? s.allow_previous : true,
        auto_advance: s.auto_advance !== undefined ? s.auto_advance : false,
      };
    });
  }

  /**
   * Calculates progression percentage and completed step array.
   */
  static calculateProgress(
    currentStepNumber: number,
    totalSteps: number,
    elapsedSeconds: number,
    completedStepsInput?: number[]
  ): SessionProgress {
    const validTotal = Math.max(1, totalSteps);
    const completedSet = new Set(completedStepsInput || []);

    // Mark all preceding steps as completed
    for (let i = 1; i < currentStepNumber; i++) {
      completedSet.add(i);
    }

    const completedSteps = Array.from(completedSet).sort((a, b) => a - b);
    const completionPercentage = Math.min(100, Math.round((completedSteps.length / validTotal) * 100));

    return {
      current_step: currentStepNumber,
      total_steps: validTotal,
      completed_steps: completedSteps,
      elapsed_seconds: elapsedSeconds,
      last_activity: new Date().toISOString(),
      completion_percentage: completionPercentage,
    };
  }

  /**
   * Validates if moving to previous step is allowed.
   */
  static canMovePrevious(steps: InterventionStep[], currentStepNumber: number): boolean {
    if (currentStepNumber <= 1) return false;
    const currentStep = steps[currentStepNumber - 1];
    return currentStep ? currentStep.allow_previous : true;
  }
}
