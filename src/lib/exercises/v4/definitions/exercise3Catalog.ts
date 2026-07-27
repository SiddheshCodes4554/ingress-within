import { ExerciseDefinition } from '../types/exercise.types';

export const EXERCISE_3_DEFINITION: ExerciseDefinition = {
  id: 'exercise_3',
  exercise_type: 'self_perception',
  title: 'Self Perception Test',
  description: 'Structured self-perception mapping measuring self-ideal congruence and identity alignment.',
  unlock_rules: { day: 23, cycle: 1, strategy: 'day_locked' },
  cycle: 1,
  frequency: 'once_per_cycle',
  estimated_duration: 5,
  version: '2.0',
  active_status: true
};

export const EXERCISE_3_CONFIG = {
  exercise_number: 3,
  exercise_key: 'self_perception',
  title: 'Self Perception Test',
  description: 'Structured self-perception mapping measuring self-ideal congruence and identity alignment.',
  unlock_day: 23,
  runs_once: true,
  cycle: 1
};
