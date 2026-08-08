import { ExerciseDefinition } from '../types/exercise.types';

export const CORE_VALUES_DEFINITION: ExerciseDefinition = {
  id: 'core_values_card_sort',
  exercise_type: 'core_values_card_sort',
  title: 'Core Values Card Sort',
  description: '5–7 minute forced-choice values exercise mapping your primary behavioral principles.',
  unlock_rules: { day: 35, strategy: 'day_locked' },
  cycle: 2,
  frequency: 'once_per_cycle',
  estimated_duration: 6,
  version: '1.0',
  active_status: true
};

export const CORE_VALUES_CONFIG = {
  exercise_id: 'core_values_card_sort',
  title: 'Core Values Card Sort',
  description: '5–7 minute forced-choice values exercise mapping your primary behavioral principles.',
  unlock_day: 35
};

export interface ValueItem {
  id: string;
  name: string;
  definition: string;
  example: string;
}

export const CORE_VALUES_ITEMS: ValueItem[] = [
  {
    id: 'achievement',
    name: 'Achievement',
    definition: 'Making progress, reaching goals, doing things well.',
    example: 'You finish something you started even when the motivation has gone, because finishing matters to you.'
  },
  {
    id: 'adventure',
    name: 'Adventure',
    definition: 'New experiences, taking risks, exploring the unfamiliar.',
    example: 'You choose the option you haven\'t tried before even when the familiar one would be easier.'
  },
  {
    id: 'authenticity',
    name: 'Authenticity',
    definition: 'Being genuine, honest about who you actually are.',
    example: 'You say what you actually think in a conversation even when you can read the room wants something different.'
  },
  {
    id: 'autonomy',
    name: 'Autonomy',
    definition: 'Making your own choices, not being directed by others.',
    example: 'You push back when someone tries to make a decision for you, even when it would be simpler to let them.'
  },
  {
    id: 'balance',
    name: 'Balance',
    definition: 'Not letting one area of life crowd out the others.',
    example: 'You stop working at a certain point even when there is more to do, because other parts of your life need the time.'
  },
  {
    id: 'belonging',
    name: 'Belonging',
    definition: 'Feeling accepted, part of something, genuinely connected.',
    example: 'You stay in situations longer than you need to because leaving would mean losing the connection.'
  },
  {
    id: 'compassion',
    name: 'Compassion',
    definition: 'Caring for others and responding to their suffering.',
    example: 'You adjust what you were going to do because someone near you is having a hard time.'
  },
  {
    id: 'creativity',
    name: 'Creativity',
    definition: 'Making things, expressing yourself, thinking originally.',
    example: 'You find a way to do something differently even when the standard way would work fine.'
  },
  {
    id: 'family',
    name: 'Family',
    definition: 'Being close to family and showing up for them.',
    example: 'You change your plans when a family member needs something, without resenting it.'
  },
  {
    id: 'freedom',
    name: 'Freedom',
    definition: 'Living on your own terms, without constraint.',
    example: 'You leave or push back against situations that feel like they are controlling you, even at a cost.'
  },
  {
    id: 'growth',
    name: 'Growth',
    definition: 'Learning, developing, becoming more capable or self-aware.',
    example: 'You seek out feedback you didn\'t ask for because you would rather know than not know.'
  },
  {
    id: 'honesty',
    name: 'Honesty',
    definition: 'Telling the truth, including when it\'s uncomfortable.',
    example: 'You say the thing that is true even when a softer version would be easier for everyone.'
  },
  {
    id: 'integrity',
    name: 'Integrity',
    definition: 'Doing what you said you would do.',
    example: 'You follow through on something you committed to even when circumstances changed and it would be reasonable to drop it.'
  },
  {
    id: 'justice',
    name: 'Justice',
    definition: 'Standing up for fairness, not looking the other way.',
    example: 'You say something when you see something unfair happening, even when staying quiet would be easier.'
  },
  {
    id: 'loyalty',
    name: 'Loyalty',
    definition: 'Sticking by people you care about over time.',
    example: 'You show up for someone who is struggling even when you have other things to do.'
  },
  {
    id: 'peace',
    name: 'Peace',
    definition: 'Calm, low conflict, internal quiet.',
    example: 'You let a conversation end without saying the thing you were thinking, because the quiet felt more important than being right.'
  },
  {
    id: 'purpose',
    name: 'Purpose',
    definition: 'Feeling like what you do actually matters.',
    example: 'You find it hard to sustain effort on things that don\'t feel meaningful, even when they are practical.'
  },
  {
    id: 'recognition',
    name: 'Recognition',
    definition: 'Being seen, acknowledged, appreciated for what you do.',
    example: 'You notice when your contribution is not acknowledged, and it affects how much you invest next time.'
  },
  {
    id: 'security',
    name: 'Security',
    definition: 'Stability, safety, predictability in your life.',
    example: 'You make the safer choice even when the riskier one has more potential upside, because uncertainty costs you more.'
  },
  {
    id: 'service',
    name: 'Service',
    definition: 'Contributing to others, making a difference.',
    example: 'You are most energised when what you are doing has a clear benefit for someone else.'
  }
];

export function calculateReorderDelta(selectionOrder: string[], finalRankedValues: string[]): number {
  if (!selectionOrder || !finalRankedValues || selectionOrder.length !== 5 || finalRankedValues.length !== 5) {
    return 0;
  }
  let deltaCount = 0;
  for (let i = 0; i < finalRankedValues.length; i++) {
    const val = finalRankedValues[i];
    const selectionPosition = selectionOrder.indexOf(val) + 1; // 1-indexed
    const finalRank = i + 1; // 1-indexed
    if (selectionPosition > 0 && Math.abs(selectionPosition - finalRank) > 2) {
      deltaCount++;
    }
  }
  return deltaCount;
}
