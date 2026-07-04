-- ========================================================
-- DATABASE MIGRATION: REPORT DATA INTEGRITY & SOURCE AUDIT
-- ========================================================

-- Start Transaction
BEGIN;

-- 1. Extend CRISIS_LOG table with auditing columns
ALTER TABLE public.crisis_log
    ADD COLUMN IF NOT EXISTS entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS cycle_id UUID REFERENCES public.cycles(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS week_number INTEGER,
    ADD COLUMN IF NOT EXISTS journal_date DATE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- 2. Backfill existing crisis logs where possible
-- If the timestamp matches an entry's created_at (or is very close), link them.
-- Otherwise, leave nullable for backwards compatibility.
UPDATE public.crisis_log cl
SET 
    entry_id = e.id,
    cycle_id = e.cycle_id,
    week_number = COALESCE(ceil(e.cycle_day / 7.0)::integer, 1),
    journal_date = e.created_at::date,
    created_at = cl.timestamp
FROM public.entries e
WHERE cl.user_id = e.user_id 
  AND e.created_at::date = cl.timestamp::date
  AND cl.entry_id IS NULL;

COMMIT;
