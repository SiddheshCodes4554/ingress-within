export type ExerciseLifecycleStatus =
  | 'locked'
  | 'available'
  | 'started'
  | 'in_progress'
  | 'submitted'
  | 'processing'
  | 'completed';

export interface ExerciseDefinition {
  id: string; // e.g. 'exercise_0', 'exercise_1'
  exercise_type: string;
  title: string;
  description?: string;
  unlock_rules?: Record<string, any>;
  cycle?: number;
  frequency?: string;
  estimated_duration?: number;
  version?: string;
  active_status?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ExerciseInstance {
  id: string;
  user_id: string;
  cycle_id?: string;
  exercise_id: string;
  status: ExerciseLifecycleStatus;
  unlock_time?: string | null;
  started_at?: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  metadata?: Record<string, any>;
  version?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExerciseResponse {
  id?: string;
  instance_id: string;
  user_id: string;
  question_id: string;
  response: Record<string, any> | any;
  created_at?: string;
  updated_at?: string;
}

export interface ExerciseResult {
  id?: string;
  instance_id: string;
  user_id: string;
  exercise_id: string;
  summary?: string;
  data: Record<string, any>;
  version?: string;
  created_at?: string;
}

export interface ExerciseEvent {
  id?: string;
  instance_id?: string;
  user_id: string;
  event_type: string;
  payload?: Record<string, any>;
  created_at?: string;
}
