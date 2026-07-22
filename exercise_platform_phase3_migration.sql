-- Migration: Exercise Platform Result Columns Alignment (Phase 3)
-- =========================================================================

ALTER TABLE public.exercise_results ADD COLUMN IF NOT EXISTS prompt_version TEXT DEFAULT 'v1';
ALTER TABLE public.exercise_results ADD COLUMN IF NOT EXISTS engine_version TEXT DEFAULT '2.0';
ALTER TABLE public.exercise_results ADD COLUMN IF NOT EXISTS raw_json JSONB DEFAULT '{}'::jsonb;
