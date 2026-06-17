-- ========================================================
-- CREATE AI OBSERVABILITY AND FAILURES TABLES
-- Phase 1 & Observability Hardening Migration
-- ========================================================

BEGIN;

-- 1. Create ai_failures table
CREATE TABLE IF NOT EXISTS public.ai_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    raw_response TEXT,
    parsing_error TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Create ai_observability table
CREATE TABLE IF NOT EXISTS public.ai_observability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    raw_provider_response TEXT,
    parsed_response JSONB,
    validation_result JSONB,
    processing_time INTEGER NOT NULL, -- in milliseconds
    retry_count INTEGER DEFAULT 0 NOT NULL,
    error_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.ai_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_observability ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Users can view their own AI logs/failures if linked to their entries)
CREATE POLICY "Users can view their own AI failures" ON public.ai_failures
    FOR SELECT USING (
        entry_id IS NULL OR EXISTS (
            SELECT 1 FROM public.entries e 
            WHERE e.id = ai_failures.entry_id AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own AI observability logs" ON public.ai_observability
    FOR SELECT USING (
        entry_id IS NULL OR EXISTS (
            SELECT 1 FROM public.entries e 
            WHERE e.id = ai_observability.entry_id AND e.user_id = auth.uid()
        )
    );

-- Allow service role (backend operations) full access
CREATE POLICY "Service role can manage AI failures" ON public.ai_failures
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can manage AI observability" ON public.ai_observability
    FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMIT;
