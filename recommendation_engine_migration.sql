-- SQL Migration: Psychoeducation Recommendation Engine Schema
-- Table: module_recommendations

CREATE TABLE IF NOT EXISTS module_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cycle_id TEXT NOT NULL, -- Monthly cycle or report identifier (e.g. 'cycle_2026_08', 'report_month_1')
  selected_module_id TEXT REFERENCES modules(id) ON DELETE SET NULL,
  triggering_pattern_id TEXT NOT NULL,
  triggering_pattern_name TEXT,
  matched_taxonomy_concern TEXT NOT NULL,
  match_confidence NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'RECOMMENDED' CHECK (status IN ('NO_RECOMMENDATION', 'RECOMMENDED', 'PURCHASED', 'ACTIVE', 'COMPLETED', 'CRISIS_ROUTE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_monthly_recommendation UNIQUE (user_id, cycle_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_cycle ON module_recommendations(user_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_status ON module_recommendations(user_id, status);

ALTER TABLE module_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS module_recommendations_user_policy ON module_recommendations;
CREATE POLICY module_recommendations_user_policy ON module_recommendations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
