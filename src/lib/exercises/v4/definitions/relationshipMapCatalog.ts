import { ExerciseDefinition } from '../types/exercise.types';

export const RELATIONSHIP_MAP_DEFINITION: ExerciseDefinition = {
  id: 'relationship_map',
  exercise_type: 'relationship_map',
  title: 'Relationship Map',
  description: 'Map the people taking up mental space, energy dynamics, and communication patterns.',
  unlock_rules: { day: 42, strategy: 'day_locked' },
  cycle: 2,
  frequency: 'once_per_cycle',
  estimated_duration: 6,
  version: '1.0',
  active_status: true
};

export const RELATIONSHIP_MAP_CONFIG = {
  exercise_id: 'relationship_map',
  title: 'Relationship Map',
  description: 'Map the people taking up mental space, energy dynamics, and communication patterns.',
  unlock_day: 42
};

export const RELATIONSHIP_LABELS = ['Partner', 'Family', 'Friend', 'Colleague', 'Manager', 'Other'];
export const FREQUENCY_CHOICES = ['A little', 'Often', 'Constantly'];
