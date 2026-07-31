import React from 'react';
import { InstructionStep } from './steps/InstructionStep';
import { TextStep } from './steps/TextStep';
import { ChecklistStep } from './steps/ChecklistStep';
import { BreathingStep } from './steps/BreathingStep';
import { TimerStep } from './steps/TimerStep';
import { MediaStep } from './steps/MediaStep';
import { CompletionStep } from './steps/CompletionStep';

export function StepRenderer({
  step,
  intervention,
  session,
  progress,
  initialAnswer,
  onSaveAnswer,
  onNext,
  isSubmitting,
  onReturnToDashboard,
}) {
  if (!step) return null;

  const type = (step.step_type || 'instruction').toLowerCase();

  switch (type) {
    case 'text':
    case 'reflection':
      return (
        <TextStep
          step={step}
          initialValue={initialAnswer || ''}
          onSaveAnswer={onSaveAnswer}
          onNext={onNext}
          isSubmitting={isSubmitting}
        />
      );

    case 'checklist':
      return (
        <ChecklistStep
          step={step}
          onNext={onNext}
          isSubmitting={isSubmitting}
        />
      );

    case 'breathing':
      return (
        <BreathingStep
          step={step}
          onNext={onNext}
          isSubmitting={isSubmitting}
        />
      );

    case 'timer':
      return (
        <TimerStep
          step={step}
          onNext={onNext}
          isSubmitting={isSubmitting}
        />
      );

    case 'image':
    case 'video':
    case 'audio':
    case 'media':
      return (
        <MediaStep
          step={step}
          onNext={onNext}
          isSubmitting={isSubmitting}
        />
      );

    case 'completion':
      return (
        <CompletionStep
          intervention={intervention}
          session={session}
          progress={progress}
          onReturnToDashboard={onReturnToDashboard}
        />
      );

    case 'instruction':
    default:
      return (
        <InstructionStep
          step={step}
          initialValue={initialAnswer || ''}
          onSaveAnswer={onSaveAnswer}
          onNext={onNext}
          isSubmitting={isSubmitting}
        />
      );
  }
}
