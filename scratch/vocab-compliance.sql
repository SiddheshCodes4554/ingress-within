-- Ingress Within Database Compliance Migration - Vocabulary Engine (v2.5)
-- =========================================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.vocab_words CASCADE;
DROP TABLE IF EXISTS public.vocab_clusters CASCADE;

-- Create vocab_clusters
CREATE TABLE public.vocab_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    cluster_name TEXT NOT NULL,
    cluster_type TEXT NOT NULL, -- e.g., 'emotional', 'stress', 'relationship', 'self-descriptive'
    word_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create vocab_words
CREATE TABLE public.vocab_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES public.vocab_clusters(id) ON DELETE SET NULL,
    word TEXT NOT NULL,
    normalized_word TEXT NOT NULL,
    frequency INTEGER NOT NULL DEFAULT 1,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_cycle_word UNIQUE (user_id, cycle_id, normalized_word)
);

-- Create indexes for performance
CREATE INDEX idx_vocab_words_user_cycle ON public.vocab_words(user_id, cycle_id);
CREATE INDEX idx_vocab_clusters_user_cycle ON public.vocab_clusters(user_id, cycle_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.vocab_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_clusters ENABLE ROW LEVEL SECURITY;

-- Enable RLS policies so users can access their own data
CREATE POLICY "Users can manage their own vocab words" ON public.vocab_words 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own vocab clusters" ON public.vocab_clusters 
    FOR ALL USING (auth.uid() = user_id);
