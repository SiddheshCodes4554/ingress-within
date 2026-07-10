-- =====================================================
-- KNOWLEDGE PROFILE GENERATION V2 — SCHEMA MIGRATION
-- Run once in Supabase SQL editor
-- =====================================================

-- Add new profile dimensions and model metadata columns to knowledge_profile table
ALTER TABLE knowledge_profile ADD COLUMN IF NOT EXISTS stress_model JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE knowledge_profile ADD COLUMN IF NOT EXISTS values_model JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE knowledge_profile ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE knowledge_profile ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE knowledge_profile ADD COLUMN IF NOT EXISTS prompt_version TEXT;

-- Verify new columns exist
COMMENT ON COLUMN knowledge_profile.stress_model IS 'Stores observations on withdrawal, overworking, self criticism, and planning reactions';
COMMENT ON COLUMN knowledge_profile.values_model IS 'Stores observations on work, purpose, achievement, pressure, and burnout';
COMMENT ON COLUMN knowledge_profile.provider IS 'AI LLM provider used to generate the profile';
COMMENT ON COLUMN knowledge_profile.model IS 'Specific AI model name used to generate the profile';
COMMENT ON COLUMN knowledge_profile.prompt_version IS 'Internal prompt version used to generate the profile';
