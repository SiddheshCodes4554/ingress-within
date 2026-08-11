-- SQL Migration: Psychoeducation Module Player Progress & Persistence Schema
-- Tables: module_progress, module_touch_completions, module_answers, module_mhpi_responses

-- 1. Table: module_progress
CREATE TABLE IF NOT EXISTS module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  current_week INTEGER NOT NULL DEFAULT 1,
  current_touch_id TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_module_progress UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_module_progress_user_module ON module_progress(user_id, module_id);

-- 2. Table: module_touch_completions
CREATE TABLE IF NOT EXISTS module_touch_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  touch_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_module_touch UNIQUE (user_id, module_id, touch_id)
);

CREATE INDEX IF NOT EXISTS idx_touch_completions_user_module ON module_touch_completions(user_id, module_id);

-- 3. Table: module_answers
CREATE TABLE IF NOT EXISTS module_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  touch_id TEXT NOT NULL,
  step_key TEXT NOT NULL,
  answer_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_module_touch_step UNIQUE (user_id, module_id, touch_id, step_key)
);

CREATE INDEX IF NOT EXISTS idx_module_answers_user_module ON module_answers(user_id, module_id);

-- 4. Table: module_mhpi_responses
CREATE TABLE IF NOT EXISTS module_mhpi_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('baseline', 'weekly', 'end')),
  week_number INTEGER,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  severity_score INTEGER,
  improvement_pct NUMERIC(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mhpi_responses_user_module ON module_mhpi_responses(user_id, module_id);

-- RLS Policies Setup
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_touch_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_mhpi_responses ENABLE ROW LEVEL SECURITY;

-- Policies for module_progress
DROP POLICY IF EXISTS module_progress_user_policy ON module_progress;
CREATE POLICY module_progress_user_policy ON module_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for module_touch_completions
DROP POLICY IF EXISTS module_touch_completions_user_policy ON module_touch_completions;
CREATE POLICY module_touch_completions_user_policy ON module_touch_completions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for module_answers
DROP POLICY IF EXISTS module_answers_user_policy ON module_answers;
CREATE POLICY module_answers_user_policy ON module_answers
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for module_mhpi_responses
DROP POLICY IF EXISTS module_mhpi_responses_user_policy ON module_mhpi_responses;
CREATE POLICY module_mhpi_responses_user_policy ON module_mhpi_responses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
