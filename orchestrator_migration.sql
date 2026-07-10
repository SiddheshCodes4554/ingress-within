-- Migration: Platform Orchestration Foundation (Phase 1)
-- =========================================================================

-- 1. Create orchestrator_events table
CREATE TABLE IF NOT EXISTS public.orchestrator_events (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT        NOT NULL,
    payload    JSONB       NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for orchestrator_events
CREATE INDEX IF NOT EXISTS idx_orchestrator_events_user ON public.orchestrator_events(user_id);
CREATE INDEX IF NOT EXISTS idx_orchestrator_events_type ON public.orchestrator_events(event_type);
CREATE INDEX IF NOT EXISTS idx_orchestrator_events_created ON public.orchestrator_events(created_at);

-- Enable RLS
ALTER TABLE public.orchestrator_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own orchestrator events" ON public.orchestrator_events;
CREATE POLICY "Users can read own orchestrator events" ON public.orchestrator_events
    FOR SELECT USING (auth.uid() = user_id);


-- 2. Create orchestrator_jobs table
CREATE TABLE IF NOT EXISTS public.orchestrator_jobs (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    engine       TEXT        NOT NULL,
    trigger      TEXT        NOT NULL,
    status       TEXT        NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    queued_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at   TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    attempts     INTEGER     NOT NULL DEFAULT 0,
    last_error   TEXT
);

-- Indexing for orchestrator_jobs
CREATE INDEX IF NOT EXISTS idx_orchestrator_jobs_user ON public.orchestrator_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_orchestrator_jobs_status ON public.orchestrator_jobs(status);
CREATE INDEX IF NOT EXISTS idx_orchestrator_jobs_queued ON public.orchestrator_jobs(queued_at);

-- Enable RLS
ALTER TABLE public.orchestrator_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own orchestrator jobs" ON public.orchestrator_jobs;
CREATE POLICY "Users can read own orchestrator jobs" ON public.orchestrator_jobs
    FOR SELECT USING (auth.uid() = user_id);


-- 3. Create engine_state table
CREATE TABLE IF NOT EXISTS public.engine_state (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    engine_name          TEXT        NOT NULL,
    last_generated       TIMESTAMPTZ,
    last_processed_entry UUID,
    last_processed_week  INTEGER,
    status               TEXT        NOT NULL DEFAULT 'idle',
    next_action          TEXT,
    engine_version       TEXT        NOT NULL DEFAULT '1.0',
    CONSTRAINT unique_user_engine UNIQUE (user_id, engine_name)
);

-- Indexing for engine_state
CREATE INDEX IF NOT EXISTS idx_engine_state_user ON public.engine_state(user_id);
CREATE INDEX IF NOT EXISTS idx_engine_state_engine ON public.engine_state(engine_name);

-- Enable RLS
ALTER TABLE public.engine_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own engine states" ON public.engine_state;
CREATE POLICY "Users can read own engine states" ON public.engine_state
    FOR SELECT USING (auth.uid() = user_id);

-- Grant privileges for service_role and authenticated users
GRANT ALL ON public.orchestrator_events TO service_role;
GRANT ALL ON public.orchestrator_jobs TO service_role;
GRANT ALL ON public.engine_state TO service_role;

GRANT ALL ON public.orchestrator_events TO authenticated;
GRANT ALL ON public.orchestrator_jobs TO authenticated;
GRANT ALL ON public.engine_state TO authenticated;
