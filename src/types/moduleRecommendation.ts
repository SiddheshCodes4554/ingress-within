export type RecommendationStatus =
  | 'NO_RECOMMENDATION'
  | 'RECOMMENDED'
  | 'PURCHASED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CRISIS_ROUTE';

export interface MonthlyPatternInput {
  patternId: string;
  title: string;
  description?: string;
  score: number;
  rank: number;
  isCrisis?: boolean;
}

export interface RecommendationRecord {
  id: string;
  user_id: string;
  cycle_id: string;
  selected_module_id: string | null;
  triggering_pattern_id: string;
  triggering_pattern_name?: string;
  matched_taxonomy_concern: string;
  match_confidence: number;
  status: RecommendationStatus;
  created_at: string;
  updated_at: string;
}

export interface RecommendationResponse {
  status: RecommendationStatus;
  recommendation: {
    id: string;
    module: {
      id: string;
      name: string;
      slug: string;
      price: number;
      currency: string;
    } | null;
    triggeringPattern: {
      patternId: string;
      title: string;
      score: number;
    } | null;
    triggeringConcern: string | null;
    purchaseStatus: 'unpurchased' | 'active' | 'completed';
  } | null;
}
