export type Exercise3Status =
  | 'locked'
  | 'available'
  | 'started'
  | 'in_progress'
  | 'submitted'
  | 'analysing'
  | 'completed'
  | 'failed';

export interface Exercise3InstanceData {
  id: string;
  user_id: string;
  exercise_number: number;
  exercise_key: string;
  cycle_number: number;
  status: Exercise3Status;
  started_at?: string | null;
  completed_at?: string | null;
  current_step?: number;
  data?: Record<string, any>;
}

export interface Exercise3ResultData {
  id: string;
  instance_id: string;
  user_id: string;
  summary?: string;
  analysis?: Record<string, any>;
  raw_json?: Record<string, any>;
  provider?: string;
  model?: string;
  prompt_version?: string;
  analysis_version?: string;
  processing_time_ms?: number;
  generated_at?: string;
  status: Exercise3Status;
}
