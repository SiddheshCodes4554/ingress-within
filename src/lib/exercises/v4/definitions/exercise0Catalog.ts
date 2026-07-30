import { ExerciseDefinition } from '../types/exercise.types';

export const EXERCISE_0_DEFINITION: ExerciseDefinition = {
  id: 'exercise_0',
  exercise_type: 'ocean_baseline',
  title: 'Baseline Assessment',
  description: 'Initial assessment used to personalize your experience.',
  unlock_rules: { day: 1, cycle: 1, strategy: 'immediate' },
  cycle: 1,
  frequency: 'once_per_cycle',
  estimated_duration: 3,
  version: '5.0',
  active_status: true
};

export interface Exercise0Question {
  id: string;
  text: string;
  dim: 'O' | 'C' | 'E' | 'A' | 'N';
  rev?: boolean;
}

export const EXERCISE_0_QUESTIONS: Exercise0Question[] = [
  { id: 'q1',  text: "I'm drawn to ideas and questions even when they have no practical use.", dim: 'O' },
  { id: 'q3',  text: "I tend to follow through on things I set for myself even when motivation drops.", dim: 'C' },
  { id: 'q5',  text: "When I'm stressed, being around people usually helps me feel better.", dim: 'E' },
  { id: 'q7',  text: "I find it hard to express frustration or disagreement directly to someone I care about.", dim: 'A' },
  { id: 'q10', text: "My mood can be affected by things that might seem minor to others.", dim: 'N' },
  { id: 'q2',  text: "I tend to notice things — patterns, connections, ideas — that aren't directly relevant to what I'm doing.", dim: 'O' },
  { id: 'q4',  text: "When things feel out of control externally, I usually try to control what I can internally.", dim: 'C' },
  { id: 'q6',  text: "I process things better by talking them through than sitting with them alone.", dim: 'E' },
  { id: 'q8',  text: "I tend to keep difficult feelings to myself rather than share them in the moment.", dim: 'A' },
  { id: 'q11', text: "I often replay conversations or situations in my head long after they've happened.", dim: 'N' },
  { id: 'q9',  text: "When I disagree with someone, I usually just say so.", dim: 'A', rev: true },
  { id: 'q12', text: "When I'm anxious I find it hard to identify exactly what I'm anxious about.", dim: 'N' }
];

export function calculateOceanScores(answers: Record<string, number>) {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const rv = (v: number) => 6 - v;

  const a = {
    q1: Number(answers.q1) || 3,
    q2: Number(answers.q2) || 3,
    q3: Number(answers.q3) || 3,
    q4: Number(answers.q4) || 3,
    q5: Number(answers.q5) || 3,
    q6: Number(answers.q6) || 3,
    q7: Number(answers.q7) || 3,
    q8: Number(answers.q8) || 3,
    q9: Number(answers.q9) || 3,
    q10: Number(answers.q10) || 3,
    q11: Number(answers.q11) || 3,
    q12: Number(answers.q12) || 3,
  };

  return {
    ocean_O: r1((a.q1 + a.q2) / 2),
    ocean_C: r1((a.q3 + a.q4) / 2),
    ocean_E: r1((a.q5 + a.q6) / 2),
    ocean_A: r1((a.q7 + a.q8 + rv(a.q9)) / 3),
    ocean_N: r1((a.q10 + a.q11 + a.q12) / 3),
  };
}
