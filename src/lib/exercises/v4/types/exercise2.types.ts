export type Exercise2Status = 'locked' | 'available' | 'in_progress' | 'analysing' | 'completed' | 'failed';

export interface Exercise2Instance {
  id: string;
  user_id: string;
  cycle_number: number;
  exercise_number: number; // 2
  exercise_id: string; // 'exercise_2' / 'inkblot_projective'
  status: Exercise2Status;
  current_image: number; // 1 to 5
  current_step: number; // 1 to 3
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Exercise2Result {
  id: string;
  exercise_instance_id: string;
  user_id: string;
  raw_responses: Array<{
    image_index: number;
    step_index: number;
    response: string;
  }>;
  generated_image_urls: string[];
  generation_seeds: string[];
  default_lens_label: string;
  lens_by_image: Array<{
    image_index: number;
    lens: string;
  }>;
  entry_confirmation: 'yes' | 'partial' | 'absent';
  de_animation_flag: boolean;
  most_revealing_image: number;
  performance_flag: boolean;
  ai_analysis_text: string | null;
  entry_count_at_completion: number | null;
  completed_at: string | null;
  status: Exercise2Status;
  created_at: string;
}
