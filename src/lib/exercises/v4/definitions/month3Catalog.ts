export interface Month3ExerciseConfig {
  id: string;
  title: string;
  description: string;
  branch: string;
  minEntries: number;
  estimatedDuration: number;
}

export const MONTH3_EXERCISES: Record<string, Month3ExerciseConfig> = {
  avoidance_audit: {
    id: 'avoidance_audit',
    title: 'Avoidance Audit',
    description: 'Surface active avoidance patterns — identifying what you are circling without naming.',
    branch: 'A',
    minEntries: 18,
    estimatedDuration: 10
  },
  trigger_mapping: {
    id: 'trigger_mapping',
    title: 'Trigger Mapping',
    description: 'Map the situational architecture of reactive states and identify agency decision points.',
    branch: 'B',
    minEntries: 21,
    estimatedDuration: 10
  },
  body_signal_inventory: {
    id: 'body_signal_inventory',
    title: 'Body Signal Inventory',
    description: 'Somatic pattern awareness — surface physical signals as emotional data.',
    branch: 'C',
    minEntries: 15,
    estimatedDuration: 8
  },
  narrative_arc: {
    id: 'narrative_arc',
    title: 'Narrative Arc Exercise',
    description: 'Identify stable structures beneath high-intensity emotional variability across the past 3 months.',
    branch: 'D',
    minEntries: 18,
    estimatedDuration: 8
  }
};

/**
 * Resolves the active Month 3 exercise for a user based on their fixed Day-30 branch assignment
 * and scores (applying secondary sequence modifications).
 */
export function resolveMonth3Exercise(
  branch: string,
  scores?: { sa_avg?: number; ei_avg?: number; dt_score?: number }
): { exerciseId: string; minEntries: number; isSecondaryModified: boolean } {
  const normBranch = (branch || 'A').toUpperCase().trim();
  const sa = scores?.sa_avg;
  const ei = scores?.ei_avg;

  // Secondary Rule 1: Branch A + SA <= 4 -> Narrative Arc before Avoidance Audit
  if (normBranch === 'A' && sa !== undefined && sa <= 4) {
    return { exerciseId: 'narrative_arc', minEntries: 18, isSecondaryModified: true };
  }

  // Secondary Rule 2: Branch B + EI >= 7 -> Body Signal Inventory before Trigger Mapping
  if (normBranch === 'B' && ei !== undefined && ei >= 7) {
    return { exerciseId: 'body_signal_inventory', minEntries: 15, isSecondaryModified: true };
  }

  // Primary Branch Routing
  switch (normBranch) {
    case 'B':
      return { exerciseId: 'trigger_mapping', minEntries: 21, isSecondaryModified: false };
    case 'C':
      return { exerciseId: 'body_signal_inventory', minEntries: 15, isSecondaryModified: false };
    case 'D':
      return { exerciseId: 'narrative_arc', minEntries: 18, isSecondaryModified: false };
    case 'A':
    default:
      return { exerciseId: 'avoidance_audit', minEntries: 18, isSecondaryModified: false };
  }
}

// --- 1. AVOIDANCE AUDIT PROMPTS ---
export const AVOIDANCE_AUDIT_PROMPTS = [
  {
    id: 1,
    domain: 'deferred_conversations',
    stem: "The conversation I've been putting off longest is with… "
  },
  {
    id: 2,
    domain: 'unmade_decisions',
    stem: "The decision I keep researching instead of making is… "
  },
  {
    id: 3,
    domain: 'mislabelled_feelings',
    stem: "The feeling I most quickly call something else is… "
  },
  {
    id: 4,
    domain: 'externalised_responsibility',
    stem: "The situation I most often describe as someone else's fault when part of it isn't is… "
  },
  {
    id: 5,
    domain: 'withheld_wants',
    stem: "The thing I'm most afraid to want because I'm not sure I'll get it is… "
  },
  {
    id: 6,
    domain: 'unacknowledged_self_aspects',
    stem: "The version of myself I'm most reluctant to admit exists is… "
  }
];

// --- 3. BODY SIGNAL INVENTORY SYSTEMS & SIGNALS ---
export interface BodySignalSystem {
  id: string;
  name: string;
  positiveOption: string;
  signals: {
    id: string;
    label: string;
    type: 'spatial' | 'temporal';
    chips?: string[];
  }[];
}

export const BODY_SIGNAL_SYSTEMS: BodySignalSystem[] = [
  {
    id: 'sleep',
    name: 'Sleep',
    positiveOption: 'Sleep feels steady and restorative',
    signals: [
      { id: 'sleep_fall', label: 'Difficulty falling asleep', type: 'temporal', chips: ['At bedtime', 'Late at night', 'When mind is racing'] },
      { id: 'sleep_wake', label: 'Waking during the night', type: 'temporal', chips: ['Early morning (2–4 AM)', 'Multiple times', 'Before alarm'] },
      { id: 'sleep_excess', label: 'Sleeping significantly more than usual', type: 'temporal', chips: ['Weekends', 'After stressful days', 'All day'] },
      { id: 'sleep_unrested', label: 'Feeling unrested after sleep', type: 'temporal', chips: ['Upon waking', 'Throughout morning', 'Constantly'] }
    ]
  },
  {
    id: 'appetite',
    name: 'Appetite',
    positiveOption: 'Appetite and nourishment feel balanced',
    signals: [
      { id: 'appetite_loss', label: 'Eating significantly less or skipping meals', type: 'temporal', chips: ['During stressful weeks', 'When anxious', 'Busy workdays'] },
      { id: 'appetite_forget', label: 'Forgetting to eat', type: 'temporal', chips: ['Mid-day', 'Deep in work', 'Until evening'] },
      { id: 'appetite_none', label: 'No appetite without feeling full', type: 'temporal', chips: ['Morning', 'All day', 'Before events'] }
    ]
  },
  {
    id: 'tension',
    name: 'Tension',
    positiveOption: 'Muscles feel relaxed and free of tension',
    signals: [
      { id: 'tension_jaw', label: 'Jaw or teeth clenching', type: 'spatial' },
      { id: 'tension_neck', label: 'Shoulder or neck tension', type: 'spatial' },
      { id: 'tension_headache', label: 'Headaches or temple pressure', type: 'spatial' },
      { id: 'tension_back', label: 'Lower back tension or stiffness', type: 'spatial' },
      { id: 'tension_stomach', label: 'Stomach tightness or knotting', type: 'spatial' }
    ]
  },
  {
    id: 'energy',
    name: 'Energy',
    positiveOption: 'Energy levels are steady and predictable',
    signals: [
      { id: 'energy_fatigue', label: 'Persistent physical fatigue', type: 'temporal', chips: ['Afternoon dip', 'All day', 'Post-socializing'] },
      { id: 'energy_drop', label: 'Sudden energy drops', type: 'temporal', chips: ['Mid-morning', 'After difficult interactions', 'Suddenly'] },
      { id: 'energy_start', label: 'Difficulty starting tasks', type: 'temporal', chips: ['Morning', 'Switching contexts', 'Important projects'] },
      { id: 'energy_heavy', label: 'Feeling physically heavy', type: 'spatial' }
    ]
  },
  {
    id: 'digestion',
    name: 'Digestion',
    positiveOption: 'Digestion is comfortable and calm',
    signals: [
      { id: 'dig_upset', label: 'Stomach upset without physical cause', type: 'spatial' },
      { id: 'dig_nausea', label: 'Nausea in specific situations', type: 'temporal', chips: ['Before hard conversations', 'Before work', 'Morning'] },
      { id: 'dig_stress', label: 'Digestive changes during stress', type: 'temporal', chips: ['High-stress days', 'Conflict moments', 'Traveling'] }
    ]
  },
  {
    id: 'breathing',
    name: 'Breathing',
    positiveOption: 'Breathing is easy, deep, and smooth',
    signals: [
      { id: 'breath_shallow', label: 'Shallow breathing noticed', type: 'temporal', chips: ['At computer', 'In meetings', 'When focused'] },
      { id: 'breath_sigh', label: 'Sighing frequently', type: 'temporal', chips: ['Throughout the day', 'When sitting down', 'Unconsciously'] },
      { id: 'breath_chest', label: 'Chest tightness', type: 'spatial' },
      { id: 'breath_full', label: 'Difficulty taking a full breath', type: 'spatial' }
    ]
  }
];

export const BODY_SIGNAL_QUESTIONS = [
  {
    id: 'q1',
    stem: "The physical experience I notice most consistently is… ",
    required: true
  },
  {
    id: 'q2',
    stem: "I tend to notice it when… ",
    required: true
  },
  {
    id: 'q3',
    stem: "I've connected it to… ",
    required: false,
    helper: "I haven't connected it to anything is a complete answer."
  }
];

// --- 4. NARRATIVE ARC QUESTIONS ---
export const NARRATIVE_ARC_QUESTIONS = [
  {
    id: 1,
    prompt: "If you had to describe the emotional theme of the past 3 months in one sentence, what would it be?",
    placeholder: "Write in your own words..."
  },
  {
    id: 2,
    prompt: "What do you understand now that you didn't when you started writing here?",
    placeholder: "Reflect on what has become clearer..."
  },
  {
    id: 3,
    prompt: "What has stayed exactly the same despite the writing?",
    placeholder: "Name what has remained constant..."
  },
  {
    id: 4,
    prompt: "Describe one moment in the past 3 months where you made a choice — however small — that was different from what you would have done automatically.",
    placeholder: "Describe the specific situation and choice..."
  }
];
