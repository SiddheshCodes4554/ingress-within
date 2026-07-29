import { Intervention, InterventionCategory, InterventionHistory, InterventionResponse, InterventionSession, RecommendationResult } from './intervention';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_more: boolean;
  };
}

export interface CatalogFilterParams extends PaginationParams {
  category?: string;
  max_duration?: number;
  difficulty?: string;
  search?: string;
  status?: string;
}

export interface InterventionDetailResponse {
  intervention: Intervention;
  is_favourite: boolean;
  active_session?: InterventionSession | null;
  previous_responses?: InterventionResponse[];
}

export interface StartSessionDTO {
  intervention_id: string;
}

export interface CompleteSessionDTO {
  session_id: string;
  elapsed_seconds?: number;
  responses?: Array<{ question_id: string; answer: string }>;
}

export interface FavouriteDTO {
  intervention_id: string;
  action?: 'favourite' | 'unfavourite' | 'toggle';
}

export interface RecommendationResponse {
  engine_version: string;
  recommended: RecommendationResult[];
  inputs_evaluated: {
    vocab_keywords_count: number;
    active_patterns_count: number;
    completed_exercises_count: number;
    current_cycle_id?: string;
  };
}
