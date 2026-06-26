-- ========================================================
-- DATABASE INDEXES FOR PERFORMANCE & SCALABILITY
-- ========================================================

BEGIN;

-- 1. Index on entries for user recent list and streak queries
CREATE INDEX IF NOT EXISTS idx_entries_user_created_at_desc
ON public.entries(user_id, created_at DESC);

-- 2. Index on cycles for active cycle lookups
CREATE INDEX IF NOT EXISTS idx_cycles_user_status
ON public.cycles(user_id, status);

-- 3. Composite index on reflections for cycle open thread counts
CREATE INDEX IF NOT EXISTS idx_reflections_cycle_status
ON public.reflections(cycle_id, status);

-- 4. Index on weekly summaries for cycle summary counts (if not already defined)
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_cycle_id
ON public.weekly_summaries(cycle_id);

COMMIT;
