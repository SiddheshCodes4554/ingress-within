export interface ModuleProgressRecord {
  id: string;
  user_id: string;
  module_id: string;
  status: 'active' | 'completed' | 'paused';
  current_week: number;
  current_touch_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TouchCompletionRecord {
  id: string;
  user_id: string;
  module_id: string;
  touch_id: string;
  completed_at: string;
}

export interface ModuleAnswerRecord {
  id: string;
  user_id: string;
  module_id: string;
  touch_id: string;
  step_key: string;
  answer_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MhpiResponseRecord {
  id: string;
  user_id: string;
  module_id: string;
  assessment_type: 'baseline' | 'weekly' | 'end';
  week_number: number | null;
  responses: Record<string, any>;
  severity_score: number | null;
  improvement_pct: number | null;
  created_at: string;
  updated_at: string;
}

export interface CompleteUserModuleState {
  progress: ModuleProgressRecord | null;
  completedTouches: string[];
  answers: Record<string, Record<string, any>>; // touchId -> stepKey -> data
  mhpi: {
    baseline: MhpiResponseRecord | null;
    weekly: Record<string, MhpiResponseRecord>; // 'w1' -> record
    end: MhpiResponseRecord | null;
  };
}
