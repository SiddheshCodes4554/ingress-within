-- Migration: Vocabulary Engine V2 Schema Updates (v8.0)
-- =========================================================================

-- 1. Alter vocab_extractions to support granularity, versioning, and traceability
ALTER TABLE public.vocab_extractions 
    ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.thread_responses(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS source_type TEXT, -- 'journal' | 'thread'
    ADD COLUMN IF NOT EXISTS original_word TEXT,
    ADD COLUMN IF NOT EXISTS sentence_context TEXT,
    ADD COLUMN IF NOT EXISTS extractor_version TEXT DEFAULT '2.0',
    ADD COLUMN IF NOT EXISTS prompt_version TEXT DEFAULT '2.0',
    ADD COLUMN IF NOT EXISTS provider TEXT,
    ADD COLUMN IF NOT EXISTS model TEXT,
    ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. Create index on thread_id
CREATE INDEX IF NOT EXISTS idx_vocab_extractions_thread_id ON public.vocab_extractions(thread_id);

-- 3. Create vocab_snapshots table for caching cycle-level insights
CREATE TABLE IF NOT EXISTS public.vocab_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    snapshot_data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_cycle_snapshot UNIQUE (user_id, cycle_id)
);

-- Index for snapshot lookups
CREATE INDEX IF NOT EXISTS idx_vocab_snapshots_user_cycle ON public.vocab_snapshots(user_id, cycle_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.vocab_snapshots ENABLE ROW LEVEL SECURITY;

-- Enable RLS policies
DROP POLICY IF EXISTS "Users can manage their own vocab snapshots" ON public.vocab_snapshots;
CREATE POLICY "Users can manage their own vocab snapshots" ON public.vocab_snapshots 
    FOR ALL USING (auth.uid() = user_id);
