-- Migration: Guided Writing V2 (entry_mode & analytics tracking)
-- =========================================================================

ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS entry_mode VARCHAR(20) DEFAULT 'free';
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS abandoned BOOLEAN DEFAULT false;
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS resume_count INTEGER DEFAULT 0;
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS completion_time INTEGER;

-- Add index on entry_mode for analytical queries
CREATE INDEX IF NOT EXISTS idx_entries_entry_mode ON public.entries(entry_mode);

-- Add reflection_type column to reflections table if missing
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS reflection_type VARCHAR(50) DEFAULT 'normal';
