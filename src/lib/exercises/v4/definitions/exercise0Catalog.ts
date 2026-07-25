import { ExerciseDefinition } from '../types/exercise.types';

export const EXERCISE_0_DEFINITION: ExerciseDefinition = {
  id: 'exercise_0',
  exercise_type: 'psychometric_baseline',
  title: 'Cognitive & Emotional Baseline',
  description: 'An initial baseline assessment measuring emotional processing, internal tension responses, and values alignment.',
  unlock_rules: { day: 1, cycle: 1, strategy: 'immediate' },
  cycle: 1,
  frequency: 'once_per_cycle',
  estimated_duration: 5,
  version: '4.0',
  active_status: true
};

export interface ExerciseQuestion {
  id: string;
  type: 'scale' | 'choice' | 'text';
  title: string;
  subtitle?: string;
  options?: { value: any; label: string }[];
  minLabel?: string;
  maxLabel?: string;
}

export const EXERCISE_0_QUESTIONS: ExerciseQuestion[] = [
  {
    id: 'q1',
    type: 'scale',
    title: 'How easily do you process unexpected shifts in your emotional state?',
    subtitle: 'Select the rating that best reflects your experience over the past 7 days.',
    minLabel: '1 - Highly Overwhelmed',
    maxLabel: '5 - Complete Ease'
  },
  {
    id: 'q2',
    type: 'choice',
    title: 'When experiencing strong internal tension, what is your primary initial response?',
    subtitle: 'Choose the option that feels most automatic for you.',
    options: [
      { value: 'internal_withdrawal', label: 'Internal withdrawal and quiet contemplation' },
      { value: 'external_expression', label: 'Expressing thoughts to someone trusted' },
      { value: 'logical_analysis', label: 'Analyzing the underlying logic or cause' },
      { value: 'immediate_action', label: 'Taking immediate physical or practical action' }
    ]
  },
  {
    id: 'q3',
    type: 'scale',
    title: 'How frequently do you observe recurring patterns in your daily thoughts?',
    subtitle: 'Notice the degree of awareness you hold regarding repeated mental loops.',
    minLabel: '1 - Rarely Notice',
    maxLabel: '5 - Constantly Aware'
  },
  {
    id: 'q4',
    type: 'text',
    title: 'Describe a recent moment where your internal reaction surprised you.',
    subtitle: 'Share a brief reflection in your own words.'
  },
  {
    id: 'q5',
    type: 'scale',
    title: 'How aligned do you feel with your personal values when making decisions under pressure?',
    subtitle: 'Rate your sense of inner consistency.',
    minLabel: '1 - Low Alignment',
    maxLabel: '5 - Full Alignment'
  }
];
