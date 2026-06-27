-- ========================================================
-- SCHEMA FOR THREADS AND THREAD RESPONSES (FOUNDER CLARIFIED)
-- Run this in your Supabase SQL Editor
-- ========================================================

-- 1. Create threads table
CREATE TABLE IF NOT EXISTS public.threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    reflection_id UUID NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
    closing_question TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Answered', 'Archived')),
    draft_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create thread_responses table
CREATE TABLE IF NOT EXISTS public.thread_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    used_for_scoring BOOLEAN DEFAULT false NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_responses ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for threads
DROP POLICY IF EXISTS "Users can manage their own threads" ON public.threads;
CREATE POLICY "Users can manage their own threads" ON public.threads
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Create RLS Policies for thread_responses
DROP POLICY IF EXISTS "Users can manage their own thread responses" ON public.thread_responses;
CREATE POLICY "Users can manage their own thread responses" ON public.thread_responses
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
