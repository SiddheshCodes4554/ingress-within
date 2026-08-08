import { ExerciseDefinition } from '../types/exercise.types';

export const BODY_SIGNAL_INVENTORY_DEFINITION: ExerciseDefinition = {
  id: 'body_signal_inventory',
  exercise_type: 'body_signal_inventory',
  title: 'Body Signal Inventory',
  description: 'Structured somatic inventory mapping physical signals across 6 body systems.',
  unlock_rules: { day: 49, strategy: 'day_locked' },
  cycle: 2,
  frequency: 'once_per_cycle',
  estimated_duration: 7,
  version: '1.0',
  active_status: true
};

export const BODY_SIGNAL_CONFIG = {
  exercise_id: 'body_signal_inventory',
  title: 'Body Signal Inventory',
  description: 'Structured somatic inventory mapping physical signals across 6 body systems.',
  unlock_day: 49
};

export interface SystemItem {
  key: string;
  label: string;
  temporal: boolean;
  signals: string[];
}

export const BODY_SYSTEMS: SystemItem[] = [
  {
    key: 'sleep',
    label: 'Sleep',
    temporal: true,
    signals: [
      'Difficulty falling asleep',
      'Waking during the night',
      'Sleeping more than usual',
      'Feeling unrested after sleep',
      'Sleeping well and waking rested'
    ]
  },
  {
    key: 'appetite',
    label: 'Appetite',
    temporal: true,
    signals: [
      'Eating significantly less or more than usual',
      'Forgetting to eat',
      'Loss of appetite',
      'Appetite has felt steady and normal'
    ]
  },
  {
    key: 'tension',
    label: 'Tension',
    temporal: false,
    signals: [
      'Jaw or teeth clenching',
      'Shoulder or neck tension',
      'Headaches',
      'Lower back tension',
      'Stomach tightness',
      'Body has felt loose, no unusual tension'
    ]
  },
  {
    key: 'energy',
    label: 'Energy',
    temporal: true,
    signals: [
      'Persistent fatigue',
      'Sudden energy drops',
      'Difficulty starting tasks',
      'Feeling physically heavy',
      'Energy has felt steady'
    ]
  },
  {
    key: 'digestion',
    label: 'Digestion',
    temporal: false,
    signals: [
      'Stomach upset without physical cause',
      'Nausea in specific situations',
      'Digestive changes during stress',
      'Digestion has felt normal'
    ]
  },
  {
    key: 'breathing',
    label: 'Breathing',
    temporal: false,
    signals: [
      'Shallow breathing',
      'Sighing frequently',
      'Chest tightness',
      'Difficulty taking a full breath',
      'Breathing has felt easy and full'
    ]
  }
];

export const POSITIVE_SIGNALS = new Set([
  'Sleeping well and waking rested',
  'Appetite has felt steady and normal',
  'Body has felt loose, no unusual tension',
  'Energy has felt steady',
  'Digestion has felt normal',
  'Breathing has felt easy and full'
]);
