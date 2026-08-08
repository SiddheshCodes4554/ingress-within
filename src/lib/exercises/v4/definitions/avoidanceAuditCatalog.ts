import { ExerciseDefinition } from '../types/exercise.types';

export const AVOIDANCE_AUDIT_DEFINITION: ExerciseDefinition = {
  id: 'avoidance_audit',
  exercise_type: 'avoidance_audit',
  title: 'Avoidance Audit',
  description: 'Six incomplete sentence stems exposing subtle avoidance behaviors, procrastination, and hidden fears.',
  unlock_rules: { day: 91, strategy: 'day_locked' },
  cycle: 4,
  frequency: 'once_per_cycle',
  estimated_duration: 6,
  version: '1.0',
  active_status: true
};

export const AVOIDANCE_AUDIT_CONFIG = {
  exercise_id: 'avoidance_audit',
  title: 'Avoidance Audit',
  description: 'Six incomplete sentence stems exposing subtle avoidance behaviors, procrastination, and hidden fears.',
  unlock_day: 91
};

export interface AuditPromptItem {
  num: number;
  stem: string;
}

export const AVOIDANCE_PROMPTS: AuditPromptItem[] = [
  { num: 1, stem: "The conversation I've been putting off longest is with… " },
  { num: 2, stem: "The decision I keep researching instead of making is… " },
  { num: 3, stem: "The feeling I most quickly call something else is… " },
  { num: 4, stem: "The situation I most often describe as someone else's fault when part of it isn't is… " },
  { num: 5, stem: "The thing I'm most afraid to want because I'm not sure I'll get it is… " },
  { num: 6, stem: "The version of myself I'm most reluctant to admit exists is… " }
];
