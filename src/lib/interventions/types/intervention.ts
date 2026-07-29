export type InterventionStatus = 'active' | 'draft' | 'archived';
export type SessionStatus = 'not_started' | 'available' | 'started' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
export type InterventionDifficulty = 'easy' | 'medium' | 'hard';
export type CompletionType = 'guided_steps' | 'timer' | 'write_in';

export interface InterventionCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  display_order: number;
  is_featured: boolean;
  is_crisis: boolean;
  created_at?: string;
  updated_at?: string;
  technique_count?: number;
}

export interface InterventionQuestion {
  id: string;
  step_index?: number;
  prompt: string;
  type?: 'text' | 'rating' | 'choice';
  options?: string[];
}

export interface Intervention {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  long_description: string;
  category: string;
  subcategory?: string | null;
  difficulty: InterventionDifficulty | string;
  estimated_duration: number; // minutes
  cover_image?: string | null;
  icon?: string | null;
  steps: string[];
  questions?: InterventionQuestion[];
  completion_type: CompletionType | string;
  tags?: string[];
  contraindications?: string[];
  benefits?: string[];
  status: InterventionStatus | string;
  content_version: number;
  created_at: string;
  updated_at: string;

  // Joined category data
  category_meta?: InterventionCategory;
}

export interface InterventionSession {
  id: string;
  user_id: string;
  intervention_id: string;
  status: SessionStatus;
  started_at: string;
  completed_at?: string | null;
  last_step: number;
  elapsed_seconds: number;
}

export interface InterventionResponse {
  id: string;
  session_id: string;
  question_id: string;
  answer: string;
  created_at: string;
}

export interface InterventionHistory {
  id: string;
  user_id: string;
  intervention_id: string;
  session_id?: string | null;
  started_at: string;
  completed_at?: string | null;
  duration: number; // in seconds
  completion_state: SessionStatus;

  // Joined presentation data
  intervention?: Intervention;
}

export interface InterventionFavourite {
  id?: string;
  user_id: string;
  intervention_id: string;
  created_at: string;
}

export interface RecommendationRule {
  rule_id: string;
  trigger_source: 'pattern' | 'vocab' | 'sleep' | 'stress' | 'cycle' | 'report';
  matched_key: string;
  recommended_intervention_ids: string[];
  explanation: string;
  priority: number;
}

export interface RecommendationResult {
  intervention: Intervention;
  rule_id: string;
  matched_trigger: string;
  reason: string;
  rank_score: number;
}
