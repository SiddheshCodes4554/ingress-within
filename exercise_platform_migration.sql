-- Migration: Exercise Platform Foundation (Phase 1)
-- =========================================================================

-- 1. Create exercise_definitions table
CREATE TABLE IF NOT EXISTS public.exercise_definitions (
    id                 TEXT        PRIMARY KEY,
    exercise_type      TEXT        NOT NULL,
    unlock_rules       JSONB       NOT NULL DEFAULT '{}',
    cycle              INTEGER     DEFAULT 1,
    branch             TEXT,
    frequency          TEXT        DEFAULT 'once',
    estimated_duration INTEGER     DEFAULT 5, -- in minutes
    provider_version   TEXT        DEFAULT '1.0',
    prompt_version     TEXT        DEFAULT '1.0',
    active_status      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for exercise_definitions
CREATE INDEX IF NOT EXISTS idx_exercise_definitions_type ON public.exercise_definitions(exercise_type);
CREATE INDEX IF NOT EXISTS idx_exercise_definitions_active ON public.exercise_definitions(active_status);

-- Enable RLS for exercise_definitions (Global read-only table for users)
ALTER TABLE public.exercise_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active exercise definitions" ON public.exercise_definitions;
CREATE POLICY "Anyone can read active exercise definitions" ON public.exercise_definitions
    FOR SELECT USING (active_status = TRUE);

-- 2. Create exercise_instances table
CREATE TABLE IF NOT EXISTS public.exercise_instances (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id     TEXT        NOT NULL REFERENCES public.exercise_definitions(id) ON DELETE CASCADE,
    cycle_id        UUID        REFERENCES public.cycles(id) ON DELETE SET NULL,
    status          TEXT        NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'started', 'completed', 'analysing', 'finished', 'failed', 'archived')),
    locked          BOOLEAN     NOT NULL DEFAULT TRUE,
    available       BOOLEAN     NOT NULL DEFAULT FALSE,
    started         BOOLEAN     NOT NULL DEFAULT FALSE,
    completed       BOOLEAN     NOT NULL DEFAULT FALSE,
    expired         BOOLEAN     NOT NULL DEFAULT FALSE,
    unlock_time     TIMESTAMPTZ,
    start_time      TIMESTAMPTZ,
    completion_time TIMESTAMPTZ,
    version         TEXT        NOT NULL DEFAULT '1.0',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for exercise_instances
CREATE INDEX IF NOT EXISTS idx_exercise_instances_user ON public.exercise_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_instances_exercise ON public.exercise_instances(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_instances_cycle ON public.exercise_instances(cycle_id);
CREATE INDEX IF NOT EXISTS idx_exercise_instances_status ON public.exercise_instances(status);

-- Enable RLS for exercise_instances
ALTER TABLE public.exercise_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own exercise instances" ON public.exercise_instances;
CREATE POLICY "Users can read own exercise instances" ON public.exercise_instances
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own exercise instances" ON public.exercise_instances;
CREATE POLICY "Users can update own exercise instances" ON public.exercise_instances
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own exercise instances" ON public.exercise_instances;
CREATE POLICY "Users can insert own exercise instances" ON public.exercise_instances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Create exercise_responses table
CREATE TABLE IF NOT EXISTS public.exercise_responses (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID        NOT NULL REFERENCES public.exercise_instances(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id TEXT        NOT NULL,
    step_id     TEXT        NOT NULL,
    response    JSONB       NOT NULL DEFAULT '{}',
    metadata    JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_instance_question UNIQUE (instance_id, question_id)
);

-- Indexing for exercise_responses
CREATE INDEX IF NOT EXISTS idx_exercise_responses_instance ON public.exercise_responses(instance_id);
CREATE INDEX IF NOT EXISTS idx_exercise_responses_user ON public.exercise_responses(user_id);

-- Enable RLS for exercise_responses
ALTER TABLE public.exercise_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own exercise responses" ON public.exercise_responses;
CREATE POLICY "Users can read own exercise responses" ON public.exercise_responses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own exercise responses" ON public.exercise_responses;
CREATE POLICY "Users can update own exercise responses" ON public.exercise_responses
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own exercise responses" ON public.exercise_responses;
CREATE POLICY "Users can insert own exercise responses" ON public.exercise_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Create exercise_results table
CREATE TABLE IF NOT EXISTS public.exercise_results (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id  UUID        NOT NULL REFERENCES public.exercise_instances(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis     TEXT        NOT NULL,
    scores       JSONB       NOT NULL DEFAULT '{}',
    branch       TEXT,
    lens         TEXT,
    gap_score    NUMERIC,
    summary      TEXT,
    provider     TEXT        NOT NULL DEFAULT 'gemini',
    model        TEXT        NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for exercise_results
CREATE INDEX IF NOT EXISTS idx_exercise_results_instance ON public.exercise_results(instance_id);
CREATE INDEX IF NOT EXISTS idx_exercise_results_user ON public.exercise_results(user_id);

-- Enable RLS for exercise_results
ALTER TABLE public.exercise_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own exercise results" ON public.exercise_results;
CREATE POLICY "Users can read own exercise results" ON public.exercise_results
    FOR SELECT USING (auth.uid() = user_id);

-- 5. Create exercise_events table
CREATE TABLE IF NOT EXISTS public.exercise_events (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID        NOT NULL REFERENCES public.exercise_instances(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type  TEXT        NOT NULL CHECK (event_type IN ('locked', 'unlocked', 'started', 'resumed', 'completed', 'analysis_started', 'analysis_completed', 'failed', 'rebuilt')),
    payload     JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for exercise_events
CREATE INDEX IF NOT EXISTS idx_exercise_events_instance ON public.exercise_events(instance_id);
CREATE INDEX IF NOT EXISTS idx_exercise_events_user ON public.exercise_events(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_events_type ON public.exercise_events(event_type);

-- Enable RLS for exercise_events
ALTER TABLE public.exercise_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own exercise events" ON public.exercise_events;
CREATE POLICY "Users can read own exercise events" ON public.exercise_events
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own exercise events" ON public.exercise_events;
CREATE POLICY "Users can insert own exercise events" ON public.exercise_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant privileges for service_role and authenticated users
GRANT ALL ON public.exercise_definitions TO service_role;
GRANT ALL ON public.exercise_instances TO service_role;
GRANT ALL ON public.exercise_responses TO service_role;
GRANT ALL ON public.exercise_results TO service_role;
GRANT ALL ON public.exercise_events TO service_role;

GRANT ALL ON public.exercise_definitions TO authenticated;
GRANT ALL ON public.exercise_instances TO authenticated;
GRANT ALL ON public.exercise_responses TO authenticated;
GRANT ALL ON public.exercise_results TO authenticated;
GRANT ALL ON public.exercise_events TO authenticated;

-- Seed definitions
INSERT INTO public.exercise_definitions (id, exercise_type, unlock_rules, cycle, branch, frequency, estimated_duration, provider_version, prompt_version, active_status) VALUES
('exercise_0', 'guided', '{"strategy": "immediate"}'::jsonb, 1, NULL, 'once', 3, '1.0', '1.0', TRUE),
('exercise_1', 'guided', '{"strategy": "day_milestone", "day": 4}'::jsonb, 1, NULL, 'once', 5, '1.0', '1.0', TRUE),
('exercise_2', 'guided', '{"strategy": "day_milestone", "day": 9}'::jsonb, 1, NULL, 'once', 5, '1.0', '1.0', TRUE),
('exercise_3', 'guided', '{"strategy": "day_milestone", "day": 14}'::jsonb, 1, NULL, 'once', 5, '1.0', '1.0', TRUE),
('cbt_reframing', 'cbt', '{"strategy": "manual"}'::jsonb, 1, NULL, 'recurring', 5, '1.0', '1.0', TRUE)
ON CONFLICT (id) DO UPDATE 
SET exercise_type = EXCLUDED.exercise_type,
    unlock_rules = EXCLUDED.unlock_rules,
    cycle = EXCLUDED.cycle,
    branch = EXCLUDED.branch,
    frequency = EXCLUDED.frequency,
    estimated_duration = EXCLUDED.estimated_duration,
    provider_version = EXCLUDED.provider_version,
    prompt_version = EXCLUDED.prompt_version,
    active_status = EXCLUDED.active_status;
