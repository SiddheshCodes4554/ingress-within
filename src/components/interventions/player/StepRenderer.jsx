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

  const keyId = step.step_id || `step_${step.step_number || 1}`;

  switch (type) {
    case 'text':
    case 'reflection':
      return (
        <TextStep
          key={keyId}
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
          key={keyId}
          step={step}
          onNext={onNext}
          isSubmitting={isSubmitting}
        />
      );

    case 'breathing':
      return (
        <BreathingStep
          key={keyId}
          step={step}
          onNext={onNext}
          isSubmitting={isSubmitting}
        />
      );

    case 'timer':
      return (
        <TimerStep
          key={keyId}
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
          key={keyId}
          step={step}
          onNext={onNext}
          isSubmitting={isSubmitting}
        />
      );

    case 'completion':
      return (
        <CompletionStep
          key="completion_step"
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
          key={keyId}
          step={step}
          initialValue={initialAnswer || ''}
          onSaveAnswer={onSaveAnswer}
          onNext={onNext}
          isSubmitting={isSubmitting}
        />
      );
  }
}
