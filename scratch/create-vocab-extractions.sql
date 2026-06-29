-- Migration: Create vocab_extractions table for Vocabulary Engine Auditability (v7.0)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.vocab_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
    thread_response_id UUID REFERENCES public.thread_responses(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    normalized_word TEXT NOT NULL,
    sentence TEXT NOT NULL,
    confidence DOUBLE PRECISION DEFAULT 1.0,
    sentence_reasoning TEXT, -- reasoning/explanation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vocab_extractions_user_cycle ON public.vocab_extractions(user_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_vocab_extractions_entry ON public.vocab_extractions(entry_id);
CREATE INDEX IF NOT EXISTS idx_vocab_extractions_thread ON public.vocab_extractions(thread_response_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.vocab_extractions ENABLE ROW LEVEL SECURITY;

-- Enable RLS policies
DROP POLICY IF EXISTS "Users can manage their own vocab extractions" ON public.vocab_extractions;
CREATE POLICY "Users can manage their own vocab extractions" ON public.vocab_extractions 
    FOR ALL USING (auth.uid() = user_id);

-- Add vocab_rebuild_in_progress column to profiles table to track rebuild status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vocab_rebuild_in_progress BOOLEAN DEFAULT false;
