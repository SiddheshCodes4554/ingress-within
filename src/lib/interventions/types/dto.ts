import { Intervention, InterventionCategoryMeta, InterventionHistory, InterventionSession } from './intervention';

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
  is_favorite: boolean;
  active_session?: InterventionSession | null;
}

export interface StartSessionDTO {
  intervention_id: string;
}

export interface ResumeSessionDTO {
  session_id: string;
  last_position?: number | Record<string, unknown>;
  elapsed_seconds?: number;
}

export interface CompleteSessionDTO {
  session_id: string;
  elapsed_seconds?: number;
  responses?: Record<string, unknown>;
}

export interface FavoriteDTO {
  intervention_id: string;
  action?: 'favorite' | 'unfavorite' | 'toggle';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}
