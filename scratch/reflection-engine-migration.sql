-- Migration: Recreate reflections table with new Reflection Engine schema
BEGIN;

-- Drop reflections table if it exists to align with the new schema fields
DROP TABLE IF EXISTS public.reflections;

-- Recreate reflections table
CREATE TABLE public.reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    reflection_text TEXT NOT NULL,
    provider TEXT NOT NULL,
    confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
    themes TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('pending', 'ready', 'failed')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for reflections (users can select their own reflections)
CREATE POLICY "Users can view their own reflections" ON public.reflections
    FOR SELECT USING (auth.uid() = user_id);

COMMIT;
