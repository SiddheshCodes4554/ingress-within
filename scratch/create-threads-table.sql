-- ========================================================
-- SCHEMA FOR OPEN THREADS AND THREAD RESPONSES
-- Run this in your Supabase SQL Editor
-- ========================================================

-- 1. Create threads table
CREATE TABLE IF NOT EXISTS public.threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    origin VARCHAR(150) NOT NULL DEFAULT 'Self-Reflection',
    status VARCHAR(50) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'ACTIVE', 'RETURNED', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create thread_responses table
CREATE TABLE IF NOT EXISTS public.thread_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
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

-- 6. Seed default threads removed (User will seed manually)
