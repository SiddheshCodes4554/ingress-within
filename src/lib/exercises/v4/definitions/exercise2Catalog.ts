import { ExerciseDefinition } from '../types/exercise.types';

export const EXERCISE_2_DEFINITION: ExerciseDefinition = {
  id: 'exercise_2',
  exercise_type: 'inkblot_projective',
  title: 'Inkblot Exercise',
  description: '5-image inkblot projective exercise measuring primary defense and emotional resonance.',
  unlock_rules: { day: 16, cycle: 1, strategy: 'day_locked' },
  cycle: 1,
  frequency: 'once_per_cycle',
  estimated_duration: 5,
  version: '2.0',
  active_status: true
};

export const EXERCISE_2_CONFIG = {
  exercise_number: 2,
  exercise_key: 'inkblot_projective',
  title: 'Inkblot Exercise',
  unlock_day: 16,
  runs_once: true,
  cycle: 1
};
