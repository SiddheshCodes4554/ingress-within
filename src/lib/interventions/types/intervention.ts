export type InterventionStatus = 'active' | 'draft' | 'archived';
export type SessionStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';
export type InterventionDifficulty = 'easy' | 'medium' | 'hard';

export interface Intervention {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  duration_minutes: number;
  difficulty: InterventionDifficulty | string;
  icon?: string | null;
  cover_image?: string | null;
  type?: string;
  steps?: string[];
  cultural_note?: string | null;
  tags?: string[];
  status: InterventionStatus | string;
  content_version: number;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterventionSession {
  id: string;
  user_id: string;
  intervention_id: string;
  status: SessionStatus;
  started_at: string;
  completed_at?: string | null;
  last_position?: number | Record<string, unknown> | null;
  elapsed_seconds?: number;
  responses?: Record<string, unknown>;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterventionFavorite {
  id?: string;
  user_id: string;
  intervention_id: string;
  created_at: string;
}

export interface InterventionHistory {
  id?: string;
  user_id: string;
  intervention_id: string;
  session_id?: string | null;
  opened_at: string;
  completed_at?: string | null;
  time_spent: number; // in seconds
  deleted_at?: string | null;
  created_at: string;

  // Joined data for presentation
  intervention?: Intervention;
}

export interface InterventionCategoryMeta {
  id: string;
  slug: string;
  label: string;
  short_label: string;
  description: string;
  icon: string;
  technique_count: number;
  is_crisis?: boolean;
}
