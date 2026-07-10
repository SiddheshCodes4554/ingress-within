-- =====================================================
-- KNOWLEDGE CARDS GENERATION V2 — SCHEMA MIGRATION
-- Run once in Supabase SQL editor
-- =====================================================

-- Add new cards metadata and audit columns to knowledge_cards table
ALTER TABLE knowledge_cards ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE knowledge_cards ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE knowledge_cards ADD COLUMN IF NOT EXISTS confidence TEXT;
ALTER TABLE knowledge_cards ADD COLUMN IF NOT EXISTS supporting_patterns JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE knowledge_cards ADD COLUMN IF NOT EXISTS supporting_vocabulary JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE knowledge_cards ADD COLUMN IF NOT EXISTS supporting_entries JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE knowledge_cards ADD COLUMN IF NOT EXISTS supporting_reports JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Verify new columns exist
COMMENT ON COLUMN knowledge_cards.subtitle IS 'Context subtitle or date representation for the card';
COMMENT ON COLUMN knowledge_cards.confidence IS 'Confidence rating of the supporting profile dimension (High or Medium)';
COMMENT ON COLUMN knowledge_cards.supporting_patterns IS 'Array of supporting patterns extracted from the pattern snapshot';
COMMENT ON COLUMN knowledge_cards.supporting_vocabulary IS 'Array of supporting vocabulary words cited';
COMMENT ON COLUMN knowledge_cards.supporting_entries IS 'Array of supporting journal entry UUIDs cited';
COMMENT ON COLUMN knowledge_cards.supporting_reports IS 'Array of supporting weekly summary UUIDs cited';
