-- ========================================================
-- PATCH FOR JOURNAL_ENTRIES SCHEMA
-- Run this in your Supabase SQL Editor
-- ========================================================

-- 1. Add session_id column to journal_entries if it doesn't exist
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.daily_sessions(id) ON DELETE CASCADE;

-- 2. Add updated_at column to journal_entries if it doesn't exist
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- 3. Add index on session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_journal_entries_session_id ON public.journal_entries(session_id);

-- 4. Re-link foreign key in daily_sessions if needed
ALTER TABLE public.daily_sessions 
    DROP CONSTRAINT IF EXISTS fk_daily_sessions_journal_entry;
ALTER TABLE public.daily_sessions 
    ADD CONSTRAINT fk_daily_sessions_journal_entry 
    FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE SET NULL;
