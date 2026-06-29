-- Ingress Within Database Migration - Vocabulary Engine Alignment (v3.0)
-- =========================================================================

-- 1. Alter entries table to add vocab_processed flag
ALTER TABLE public.entries 
    ADD COLUMN IF NOT EXISTS vocab_processed BOOLEAN DEFAULT false;

-- 2. Alter thread_responses table to add vocab_processed flag
ALTER TABLE public.thread_responses 
    ADD COLUMN IF NOT EXISTS vocab_processed BOOLEAN DEFAULT false;

-- 3. Alter vocab_words table to add source column
ALTER TABLE public.vocab_words 
    ADD COLUMN IF NOT EXISTS source TEXT;

-- 4. Create vocab_concepts table
CREATE TABLE IF NOT EXISTS public.vocab_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    concept TEXT NOT NULL,
    frequency INTEGER NOT NULL DEFAULT 1,
    confidence DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_cycle_concept UNIQUE (user_id, cycle_id, concept)
);

-- Enable RLS for vocab_concepts
ALTER TABLE public.vocab_concepts ENABLE ROW LEVEL SECURITY;

-- Create policy for vocab_concepts
DROP POLICY IF EXISTS "Users can manage their own vocab concepts" ON public.vocab_concepts;
CREATE POLICY "Users can manage their own vocab concepts" ON public.vocab_concepts 
    FOR ALL USING (auth.uid() = user_id);

-- 5. Alter vocab_clusters table to add words and frequency
ALTER TABLE public.vocab_clusters 
    ADD COLUMN IF NOT EXISTS words TEXT[],
    ADD COLUMN IF NOT EXISTS frequency INTEGER NOT NULL DEFAULT 1;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vocab_concepts_user_cycle ON public.vocab_concepts(user_id, cycle_id);
