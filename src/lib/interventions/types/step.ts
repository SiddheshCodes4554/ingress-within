import { InterventionQuestion } from './intervention';

export type StepType =
  | 'instruction'
  | 'breathing'
  | 'timer'
  | 'text'
  | 'checklist'
  | 'reflection'
  | 'video'
  | 'audio'
  | 'animation'
  | 'completion'
  | string;

export interface StepMedia {
  type: 'image' | 'audio' | 'video' | 'animation';
  url: string;
  caption?: string;
}

export interface InterventionStep {
  step_id: string;
  step_number: number;
  step_type: StepType;
  title: string;
  content: string;
  optional_question?: InterventionQuestion;
  optional_media?: StepMedia;
  estimated_duration: number; // in seconds
  allow_previous: boolean;
  auto_advance: boolean;
}

export interface TimerState {
  step_id: string;
  elapsed_seconds: number;
  is_running: boolean;
  last_started_timestamp?: number;
}

export interface SessionProgress {
  current_step: number;
  total_steps: number;
  completed_steps: number[];
  elapsed_seconds: number;
  last_activity: string;
  completion_percentage: number;
  timer_state?: TimerState;
}
