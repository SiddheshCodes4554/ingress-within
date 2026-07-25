import { ExerciseDefinition } from '../types/exercise.types';

export const EXERCISE_1_DEFINITION: ExerciseDefinition = {
  id: 'exercise_1',
  exercise_type: 'word_association',
  title: 'Word Association',
  description: '12-word rapid association exercise measuring emotional register and suppression.',
  unlock_rules: { day: 10, cycle: 1, strategy: 'day_locked' },
  cycle: 1,
  frequency: 'once_per_cycle',
  estimated_duration: 3,
  version: '2.0',
  active_status: true
};

export const FIXED_WORDS: Record<number, string> = {
  1: 'HOME',
  2: 'ANGER',
  4: 'ENOUGH',
  6: 'SAFE',
  7: 'WAITING',
  8: 'WRONG',
  10: 'CLOSE',
  11: 'STILL',
  12: 'BREAK'
};

export const SENSITIVITY_EXCLUSIONS = new Set([
  'death', 'dead', 'dying', 'suicide', 'gone', 'leaving', 'alone', 'failure',
  'worthless', 'abuse', 'trauma', 'hurt', 'lost', 'ending', 'nothing',
  'hopeless', 'useless', 'empty', 'broken', 'ugly'
]);

export const FALLBACK_PERSONALISED = ['CHANGE', 'LOSS'];

export interface SequenceItem {
  position: number;
  word: string;
  source: 'fixed' | 'personalised';
}

export function buildSequence(personalisedWords: string[]): SequenceItem[] {
  const p = personalisedWords.map(w => w.toUpperCase());
  const has3 = p.length >= 3;

  return [
    { position: 1,  word: 'HOME',                        source: 'fixed' },
    { position: 2,  word: 'ANGER',                       source: 'fixed' },
    { position: 3,  word: p[0] || 'CHANGE',             source: 'personalised' },
    { position: 4,  word: 'ENOUGH',                      source: 'fixed' },
    { position: 5,  word: p[1] || 'LOSS',               source: 'personalised' },
    { position: 6,  word: 'SAFE',                        source: 'fixed' },
    { position: 7,  word: 'WAITING',                     source: 'fixed' },
    { position: 8,  word: 'WRONG',                       source: 'fixed' },
    { position: 9,  word: has3 ? p[2] : 'STILL',         source: has3 ? 'personalised' : 'fixed' },
    { position: 10, word: 'CLOSE',                       source: 'fixed' },
    { position: 11, word: has3 ? 'STILL' : 'BREAK',      source: 'fixed' },
    { position: 12, word: has3 ? 'BREAK' : 'CHANGE',     source: 'fixed' }
  ];
}
