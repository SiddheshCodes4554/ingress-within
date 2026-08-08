import { ExerciseDefinition } from '../types/exercise.types';

export const RELATIONSHIP_MAP_DEFINITION: ExerciseDefinition = {
  id: 'relationship_map',
  exercise_type: 'relationship_map',
  title: 'Relationship Map',
  description: 'Map the people taking up mental space, energy dynamics, and communication patterns.',
  unlock_rules: { day: 42, strategy: 'day_locked' },
  cycle: 2,
  frequency: 'once_per_cycle',
  estimated_duration: 7,
  version: '1.0',
  active_status: true
};

export const RELATIONSHIP_MAP_CONFIG = {
  exercise_id: 'relationship_map',
  title: 'Relationship Map',
  description: 'Map the people taking up mental space, energy dynamics, and communication patterns.',
  unlock_day: 42,
  entry_requirement: 5,
  requires_journal_history: false,
  requires_previous_exercise: false,
  enabled: true
};

export const NAME_MODES = [
  { id: 'name', label: 'Name' },
  { id: 'nickname', label: 'Nickname' },
  { id: 'initial', label: 'Initial' }
] as const;

export type NameMode = 'name' | 'nickname' | 'initial';

export const RELATIONSHIP_LABELS = ['Partner', 'Family', 'Friend', 'Colleague', 'Manager', 'Other'];

export const FREQUENCY_CHOICES = ['A little', 'Often', 'Constantly'] as const;

export const FREQUENCY_CANONICAL_MAP: Record<string, string> = {
  'A little': 'a_little',
  'Often': 'often',
  'Constantly': 'constantly',
  'a_little': 'a_little',
  'often': 'often',
  'constantly': 'constantly'
};

export const FREQUENCY_DISPLAY_MAP: Record<string, string> = {
  'a_little': 'A little',
  'often': 'Often',
  'constantly': 'Constantly',
  'A little': 'A little',
  'Often': 'Often',
  'Constantly': 'Constantly'
};

export const AMBIVALENCE_KEYWORDS = ['complicated', 'mixed', 'both', 'unsure', 'confused', 'weird'];

export function checkAmbivalence(feelingText: string): boolean {
  if (!feelingText) return false;
  const lower = feelingText.toLowerCase();
  return AMBIVALENCE_KEYWORDS.some(w => lower.includes(w));
}
