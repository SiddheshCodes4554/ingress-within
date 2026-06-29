-- Ingress Within Database Migration - Personalized Vocabulary Engine (v6.0)
-- =========================================================================

-- 1. Alter vocab_words table to support personalized attributes
ALTER TABLE public.vocab_words 
    ADD COLUMN IF NOT EXISTS semantic_meaning TEXT,
    ADD COLUMN IF NOT EXISTS context TEXT,
    ADD COLUMN IF NOT EXISTS confidence DOUBLE PRECISION DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS entry_ids UUID[] DEFAULT '{}'::uuid[];

-- Create GIN index on entry_ids for fast lookup of related entries
CREATE INDEX IF NOT EXISTS idx_vocab_words_entry_ids ON public.vocab_words USING gin(entry_ids);

-- 2. Alter vocab_clusters table to support personalized attributes
ALTER TABLE public.vocab_clusters 
    ADD COLUMN IF NOT EXISTS confidence DOUBLE PRECISION DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS description TEXT;
