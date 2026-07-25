export interface QuestionConfig {
  id: string;
  type: 'free_text' | 'scale' | 'image' | 'word_association';
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  rev?: boolean;
  dim?: 'O' | 'C' | 'E' | 'A' | 'N';
  card_index?: number;
  image_url?: string;
  short?: string;
  options?: { id: string; label: string; image_url?: string }[];
}

export const FIXED_WORD_ASSOCIATIONS = [
  { position: 1, word: 'HOME' },
  { position: 2, word: 'ANGER' },
  { position: 4, word: 'ENOUGH' },
  { position: 6, word: 'SAFE' },
  { position: 7, word: 'WAITING' },
  { position: 8, word: 'WRONG' },
  { position: 10, word: 'CLOSE' },
  { position: 11, word: 'STILL' },
  { position: 12, word: 'BREAK' }
];

export const FALLBACK_PERSONALISED_WORDS = ['CHANGE', 'LOSS', 'BOUNDARIES'];

export const INKBLOT_CARDS = [
  {
    index: 1,
    id: 'blot_1',
    image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    title: 'Card 1',
    instruction: 'What is the first thing you see in this image?'
  },
  {
    index: 2,
    id: 'blot_2',
    image_url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=600&q=80',
    title: 'Card 2',
    instruction: 'What shapes or figures stand out to you first?'
  },
  {
    index: 3,
    id: 'blot_3',
    image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
    title: 'Card 3',
    instruction: 'What feelings or movements does this pattern evoke?'
  },
  {
    index: 4,
    id: 'blot_4',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    title: 'Card 4',
    instruction: 'Take a quiet moment. What do you observe here?'
  },
  {
    index: 5,
    id: 'blot_5',
    image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    title: 'Card 5',
    instruction: 'What story or impression comes to mind when you look at this final image?'
  }
];

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

  exercise_1: Array.from({ length: 12 }, (_, i) => ({
    id: `word_${i + 1}`,
    type: 'word_association',
    label: `Word ${i + 1} of 12`
  })),

  exercise_2: INKBLOT_CARDS.map(card => ({
    id: `blot_${card.index}`,
    type: 'image',
    card_index: card.index,
    image_url: card.image_url,
    label: card.instruction
  })),

  exercise_3: [
    {
      id: 'q1',
      type: 'free_text',
      label: "In the last three weeks, when something felt hard, what did you do first — reach out, withdraw, distract yourself, or something else?",
      short: "When something felt hard...",
      placeholder: "Write your reflection here..."
    },
    {
      id: 'q2',
      type: 'free_text',
      label: "Think about a conflict or tension you had recently. How did you handle it — and how do you feel about how you handled it?",
      short: "A conflict or tension...",
      placeholder: "Write your reflection here..."
    },
    {
      id: 'q3',
      type: 'free_text',
      label: "What is something you keep meaning to do or say that you haven't yet?",
      short: "Something you keep meaning to...",
      placeholder: "Write your reflection here..."
    },
    {
      id: 'q4',
      type: 'free_text',
      label: "In the last three weeks, whose needs did you prioritise more — yours or someone else's?",
      short: "Whose needs you prioritised...",
      placeholder: "Write your reflection here..."
    },
    {
      id: 'q5',
      type: 'free_text',
      label: "What's one thing about yourself you'd change if you could, and what's stopping you?",
      short: "One thing you'd change...",
      placeholder: "Write your reflection here..."
    }
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
