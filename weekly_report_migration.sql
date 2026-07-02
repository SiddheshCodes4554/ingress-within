-- SQL Migration: Update weekly_summaries table for 11-section Weekly Reports
-- Run this in your Supabase SQL Editor.

ALTER TABLE weekly_summaries
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS why TEXT,
  ADD COLUMN IF NOT EXISTS report_data JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS engine_version TEXT DEFAULT 'v2.0';

-- Ensure we have a unique constraint on cycle_id and week_number to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'weekly_summaries_cycle_id_week_number_key'
  ) THEN
    ALTER TABLE weekly_summaries 
      ADD CONSTRAINT weekly_summaries_cycle_id_week_number_key UNIQUE (cycle_id, week_number);
  END IF;
END $$;
