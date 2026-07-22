export interface QuestionConfig {
  id: string;
  type: 'free_text' | 'scale' | 'image';
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  rev?: boolean;
  dim?: 'O' | 'C' | 'E' | 'A' | 'N';
  options?: { id: string; label: string; image_url?: string }[];
}

const CATALOG: Record<string, QuestionConfig[]> = {
  exercise_0: [
    { id: 'q1', type: 'scale', min: 1, max: 5, label: "I'm drawn to ideas and questions even when they have no practical use.", dim: 'O' },
    { id: 'q3', type: 'scale', min: 1, max: 5, label: "I tend to follow through on things I set for myself even when motivation drops.", dim: 'C' },
    { id: 'q5', type: 'scale', min: 1, max: 5, label: "When I'm stressed, being around people usually helps me feel better.", dim: 'E' },
    { id: 'q7', type: 'scale', min: 1, max: 5, label: "I find it hard to express frustration or disagreement directly to someone I care about.", dim: 'A' },
    { id: 'q10', type: 'scale', min: 1, max: 5, label: "My mood can be affected by things that seem minor to others.", dim: 'N' },
    { id: 'q2', type: 'scale', min: 1, max: 5, label: "I tend to notice things — patterns, connections, ideas — that aren't directly relevant to what I'm doing.", dim: 'O' },
    { id: 'q4', type: 'scale', min: 1, max: 5, label: "When things feel out of control externally, I usually try to control what I can internally.", dim: 'C' },
    { id: 'q6', type: 'scale', min: 1, max: 5, label: "I process things better by talking them through than sitting with them alone.", dim: 'E' },
    { id: 'q8', type: 'scale', min: 1, max: 5, label: "I tend to keep difficult feelings to myself rather than share them in the moment.", dim: 'A' },
    { id: 'q11', type: 'scale', min: 1, max: 5, label: "I often replay conversations or situations in my head long after they've happened.", dim: 'N' },
    { id: 'q13', type: 'scale', min: 1, max: 5, label: "I prefer variety and novelty over routine and predictability.", dim: 'O', rev: true },
    { id: 'q14', type: 'scale', min: 1, max: 5, label: "I often put off tasks even when I know I shouldn't.", dim: 'C', rev: true },
    { id: 'q15', type: 'scale', min: 1, max: 5, label: "I find social situations draining rather than energising.", dim: 'E', rev: true },
    { id: 'q9', type: 'scale', min: 1, max: 5, label: "When I disagree with someone, I usually just say so.", dim: 'A', rev: true },
    { id: 'q12', type: 'scale', min: 1, max: 5, label: "When I'm anxious I find it hard to identify exactly what I'm anxious about.", dim: 'N' },
    { id: 'q16', type: 'scale', min: 1, max: 5, label: "I rarely feel anxious or worried without a clear reason.", dim: 'N', rev: true }
  ],
  exercise_1: [
    { id: 'q1', type: 'free_text', label: "Identify a situation recently where your actions did not align with your core values.", placeholder: "Describe the event and your emotional reaction..." },
    { id: 'q2', type: 'scale', min: 1, max: 10, label: "How much tension or regret do you feel when reflecting on this situation?" }
  ],
  exercise_2: [
    {
      id: 'q1',
      type: 'image',
      label: "Select the inkblot pattern that resonates most with your current emotional state:",
      options: [
        { id: 'blot_1', label: 'Structured / Radial Symmetry', image_url: '/assets/blot_1.png' },
        { id: 'blot_2', label: 'Organic / Scattered Expansion', image_url: '/assets/blot_2.png' }
      ]
    },
    { id: 'q2', type: 'free_text', label: "Describe what shapes, movements, or emotions you perceive in the inkblot you selected." }
  ],
  exercise_3: [
    { id: 'q1', type: 'free_text', label: "Reflecting on your weekly insights, what core emotional triggers occurred most frequently?" },
    { id: 'q2', type: 'free_text', label: "What cognitive reframing pathways felt most natural or effective for you during this cycle?" }
  ]
};

export class QuestionsCatalog {
  /**
   * Returns list of configured questions for an exercise.
   */
  public static getQuestions(exerciseId: string): QuestionConfig[] {
    return CATALOG[exerciseId] || [];
  }
}
