-- Migration: Add arc_scoring_applied column to entries and entry_scores tables
BEGIN;

ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS arc_scoring_applied BOOLEAN DEFAULT false;
ALTER TABLE public.entry_scores ADD COLUMN IF NOT EXISTS arc_scoring_applied BOOLEAN DEFAULT false;

COMMIT;
