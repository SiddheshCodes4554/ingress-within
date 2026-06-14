-- ========================================================
-- SCHEMA FOR DAILY SESSIONS, EXERCISES, AND JOURNAL ENTRIES
-- Run this in your Supabase SQL Editor
-- ========================================================

-- 1. Create user_exercises table
CREATE TABLE IF NOT EXISTS public.user_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stressor_type VARCHAR(100) NOT NULL,
    reactive_thought TEXT NOT NULL,
    reframed_thought TEXT NOT NULL,
    clarity_score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Create daily_sessions table (without journal_entry_id constraint initially to prevent circular dependency)
CREATE TABLE IF NOT EXISTS public.daily_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    exercise_id UUID REFERENCES public.user_exercises(id) ON DELETE SET NULL,
    journal_entry_id UUID, -- Foreign key constraint added below
    status VARCHAR(50) NOT NULL DEFAULT 'start', -- 'start', 'exercise', 'interpretation', 'write', 'closing', 'complete'
    session_data JSONB DEFAULT '{}'::jsonb NOT NULL, -- Unsaved draft states (e.g. inputs) for session recovery
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Create journal_entries table referencing daily_sessions (nullable session_id to support free writes)
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.daily_sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    word_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Add the foreign key constraint to daily_sessions referencing journal_entries
ALTER TABLE public.daily_sessions 
    DROP CONSTRAINT IF EXISTS fk_daily_sessions_journal_entry;
ALTER TABLE public.daily_sessions 
    ADD CONSTRAINT fk_daily_sessions_journal_entry 
    FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE SET NULL;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.user_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for user_exercises
DROP POLICY IF EXISTS "Users can manage their own exercises" ON public.user_exercises;
CREATE POLICY "Users can manage their own exercises" ON public.user_exercises
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Create RLS Policies for daily_sessions
DROP POLICY IF EXISTS "Users can manage their own daily sessions" ON public.daily_sessions;
CREATE POLICY "Users can manage their own daily sessions" ON public.daily_sessions
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Create RLS Policies for journal_entries
DROP POLICY IF EXISTS "Users can manage their own journal entries" ON public.journal_entries;
CREATE POLICY "Users can manage their own journal entries" ON public.journal_entries
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. Trigger to auto-update updated_at timestamp on journal_entries
CREATE OR REPLACE FUNCTION public.handle_journal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_journal_entries_updated_at ON public.journal_entries;
CREATE TRIGGER trigger_journal_entries_updated_at
    BEFORE UPDATE ON public.journal_entries
    FOR EACH ROW EXECUTE FUNCTION public.handle_journal_updated_at();
