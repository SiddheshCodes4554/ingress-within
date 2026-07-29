-- Migration: Intervention Engine Foundation (Phase 1)
-- =========================================================================

-- 1. Create interventions table (Catalog)
CREATE TABLE IF NOT EXISTS public.interventions (
    id                 TEXT        PRIMARY KEY, -- e.g. 'anx_001'
    slug               TEXT        NOT NULL UNIQUE, -- e.g. '4-7-8-breathing'
    title              TEXT        NOT NULL,
    category           TEXT        NOT NULL,
    description        TEXT        NOT NULL,
    duration_minutes   INTEGER     NOT NULL DEFAULT 5,
    difficulty         TEXT        NOT NULL DEFAULT 'easy',
    icon               TEXT,
    cover_image        TEXT,
    type               TEXT        NOT NULL DEFAULT 'guided',
    steps              JSONB       NOT NULL DEFAULT '[]',
    cultural_note      TEXT,
    tags               JSONB       NOT NULL DEFAULT '[]',
    status             TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    content_version    INTEGER     NOT NULL DEFAULT 1,
    deleted_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for interventions
CREATE INDEX IF NOT EXISTS idx_interventions_category ON public.interventions(category);
CREATE INDEX IF NOT EXISTS idx_interventions_slug ON public.interventions(slug);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON public.interventions(status);

-- Enable RLS for interventions (Global read access for active non-deleted interventions)
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active interventions" ON public.interventions;
CREATE POLICY "Anyone can read active interventions" ON public.interventions
    FOR SELECT USING (status = 'active' AND deleted_at IS NULL);


-- 2. Create intervention_sessions table
CREATE TABLE IF NOT EXISTS public.intervention_sessions (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intervention_id    TEXT        NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
    status             TEXT        NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
    started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at       TIMESTAMPTZ,
    last_position      JSONB       DEFAULT '0',
    elapsed_seconds    INTEGER     DEFAULT 0,
    responses          JSONB       DEFAULT '{}',
    deleted_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for intervention_sessions
CREATE INDEX IF NOT EXISTS idx_intervention_sessions_user ON public.intervention_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_intervention_sessions_status ON public.intervention_sessions(status);
CREATE INDEX IF NOT EXISTS idx_intervention_sessions_user_status ON public.intervention_sessions(user_id, status);

-- Enable RLS for intervention_sessions
ALTER TABLE public.intervention_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own intervention sessions" ON public.intervention_sessions;
CREATE POLICY "Users can read own intervention sessions" ON public.intervention_sessions
    FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert own intervention sessions" ON public.intervention_sessions;
CREATE POLICY "Users can insert own intervention sessions" ON public.intervention_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own intervention sessions" ON public.intervention_sessions;
CREATE POLICY "Users can update own intervention sessions" ON public.intervention_sessions
    FOR UPDATE USING (auth.uid() = user_id);


-- 3. Create intervention_favorites table
CREATE TABLE IF NOT EXISTS public.intervention_favorites (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intervention_id    TEXT        NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, intervention_id)
);

-- Indexing for intervention_favorites
CREATE INDEX IF NOT EXISTS idx_intervention_favorites_user ON public.intervention_favorites(user_id);

-- Enable RLS for intervention_favorites
ALTER TABLE public.intervention_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own intervention favorites" ON public.intervention_favorites;
CREATE POLICY "Users can manage own intervention favorites" ON public.intervention_favorites
    FOR ALL USING (auth.uid() = user_id);


-- 4. Create intervention_history table
CREATE TABLE IF NOT EXISTS public.intervention_history (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intervention_id    TEXT        NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
    session_id         UUID        REFERENCES public.intervention_sessions(id) ON DELETE SET NULL,
    opened_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at       TIMESTAMPTZ,
    time_spent         INTEGER     DEFAULT 0, -- in seconds
    deleted_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for intervention_history
CREATE INDEX IF NOT EXISTS idx_intervention_history_user ON public.intervention_history(user_id);
CREATE INDEX IF NOT EXISTS idx_intervention_history_opened ON public.intervention_history(opened_at DESC);

-- Enable RLS for intervention_history
ALTER TABLE public.intervention_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own intervention history" ON public.intervention_history;
CREATE POLICY "Users can read own intervention history" ON public.intervention_history
    FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert own intervention history" ON public.intervention_history;
CREATE POLICY "Users can insert own intervention history" ON public.intervention_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 5. Create intervention_audit_logs table
CREATE TABLE IF NOT EXISTS public.intervention_audit_logs (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID        NOT NULL,
    action             TEXT        NOT NULL,
    entity_type        TEXT        NOT NULL,
    entity_id          TEXT        NOT NULL,
    metadata           JSONB       DEFAULT '{}',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intervention_audit_logs_user ON public.intervention_audit_logs(user_id);
