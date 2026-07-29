-- Migration: Intervention Engine Phase 2 (Robust Multi-Version Compatible SQL Script)
-- ===================================================================================

-- 1. Create intervention_categories table
CREATE TABLE IF NOT EXISTS public.intervention_categories (
    id            TEXT        PRIMARY KEY, -- e.g. 'anxiety_worry'
    slug          TEXT        NOT NULL UNIQUE, -- e.g. 'anxiety-worry'
    name          TEXT        NOT NULL,
    description   TEXT        NOT NULL,
    icon          TEXT        NOT NULL,
    display_order INTEGER     NOT NULL DEFAULT 0,
    is_featured   BOOLEAN     NOT NULL DEFAULT FALSE,
    is_crisis     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intervention_categories_order ON public.intervention_categories(display_order);

ALTER TABLE public.intervention_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read intervention categories" ON public.intervention_categories;
CREATE POLICY "Anyone can read intervention categories" ON public.intervention_categories
    FOR SELECT USING (true);


-- 2. Create or Upgrade interventions table
CREATE TABLE IF NOT EXISTS public.interventions (
    id                 TEXT        PRIMARY KEY,
    slug               TEXT        NOT NULL UNIQUE,
    title              TEXT        NOT NULL,
    short_description  TEXT        NOT NULL DEFAULT '',
    long_description   TEXT        NOT NULL DEFAULT '',
    category           TEXT        NOT NULL,
    subcategory        TEXT,
    difficulty         TEXT        NOT NULL DEFAULT 'easy',
    estimated_duration INTEGER     NOT NULL DEFAULT 5,
    cover_image        TEXT,
    icon               TEXT,
    steps              JSONB       NOT NULL DEFAULT '[]',
    questions          JSONB       NOT NULL DEFAULT '[]',
    completion_type    TEXT        NOT NULL DEFAULT 'guided_steps',
    tags               JSONB       NOT NULL DEFAULT '[]',
    contraindications   JSONB       NOT NULL DEFAULT '[]',
    benefits           JSONB       NOT NULL DEFAULT '[]',
    status             TEXT        NOT NULL DEFAULT 'active',
    content_version    INTEGER     NOT NULL DEFAULT 1,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade columns for existing Phase 1 table
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS long_description TEXT DEFAULT '';
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 5;
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]';
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS completion_type TEXT DEFAULT 'guided_steps';
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS contraindications JSONB DEFAULT '[]';
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]';

-- Backfill short_description if description column exists from Phase 1
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='interventions' AND column_name='description') THEN
        UPDATE public.interventions 
        SET short_description = description, long_description = description 
        WHERE short_description IS NULL OR short_description = '';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_interventions_category ON public.interventions(category);
CREATE INDEX IF NOT EXISTS idx_interventions_slug ON public.interventions(slug);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON public.interventions(status);

ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active interventions" ON public.interventions;
CREATE POLICY "Anyone can read active interventions" ON public.interventions
    FOR SELECT USING (status = 'active');


-- 3. Create or Upgrade intervention_sessions table
CREATE TABLE IF NOT EXISTS public.intervention_sessions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intervention_id TEXT        NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
    status          TEXT        NOT NULL DEFAULT 'not_started',
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    last_step       INTEGER     DEFAULT 0,
    elapsed_seconds INTEGER     DEFAULT 0
);

ALTER TABLE public.intervention_sessions ADD COLUMN IF NOT EXISTS last_step INTEGER DEFAULT 0;
ALTER TABLE public.intervention_sessions ADD COLUMN IF NOT EXISTS elapsed_seconds INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_intervention_sessions_user ON public.intervention_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_intervention_sessions_status ON public.intervention_sessions(status);
CREATE INDEX IF NOT EXISTS idx_intervention_sessions_user_status ON public.intervention_sessions(user_id, status);

ALTER TABLE public.intervention_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own intervention sessions" ON public.intervention_sessions;
CREATE POLICY "Users manage own intervention sessions" ON public.intervention_sessions
    FOR ALL USING (auth.uid() = user_id);


-- 4. Create intervention_responses table (Reflection Answers — STORED ONLY)
CREATE TABLE IF NOT EXISTS public.intervention_responses (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   UUID        NOT NULL REFERENCES public.intervention_sessions(id) ON DELETE CASCADE,
    question_id  TEXT        NOT NULL,
    answer       TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intervention_responses_session ON public.intervention_responses(session_id);

ALTER TABLE public.intervention_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own responses via session" ON public.intervention_responses;
CREATE POLICY "Users read own responses via session" ON public.intervention_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.intervention_sessions s
            WHERE s.id = intervention_responses.session_id AND s.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users insert own responses via session" ON public.intervention_responses;
CREATE POLICY "Users insert own responses via session" ON public.intervention_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.intervention_sessions s
            WHERE s.id = intervention_responses.session_id AND s.user_id = auth.uid()
        )
    );


-- 5. Create or Upgrade intervention_history table
CREATE TABLE IF NOT EXISTS public.intervention_history (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intervention_id  TEXT        NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
    session_id       UUID        REFERENCES public.intervention_sessions(id) ON DELETE SET NULL,
    started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ,
    duration         INTEGER     DEFAULT 0,
    completion_state TEXT        NOT NULL DEFAULT 'completed'
);

-- Safely migrate Phase 1 opened_at -> started_at if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intervention_history' AND column_name='opened_at')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intervention_history' AND column_name='started_at') THEN
        ALTER TABLE public.intervention_history RENAME COLUMN opened_at TO started_at;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intervention_history' AND column_name='time_spent')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='intervention_history' AND column_name='duration') THEN
        ALTER TABLE public.intervention_history RENAME COLUMN time_spent TO duration;
    END IF;
END $$;

ALTER TABLE public.intervention_history ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.intervention_history ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;
ALTER TABLE public.intervention_history ADD COLUMN IF NOT EXISTS completion_state TEXT DEFAULT 'completed';

CREATE INDEX IF NOT EXISTS idx_intervention_history_user ON public.intervention_history(user_id);
CREATE INDEX IF NOT EXISTS idx_intervention_history_started ON public.intervention_history(started_at DESC);

ALTER TABLE public.intervention_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own history" ON public.intervention_history;
CREATE POLICY "Users manage own history" ON public.intervention_history
    FOR ALL USING (auth.uid() = user_id);


-- 6. Create intervention_favourites & intervention_favorites compatibility
CREATE TABLE IF NOT EXISTS public.intervention_favourites (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intervention_id TEXT        NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, intervention_id)
);

CREATE TABLE IF NOT EXISTS public.intervention_favorites (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intervention_id TEXT        NOT NULL REFERENCES public.interventions(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, intervention_id)
);

CREATE INDEX IF NOT EXISTS idx_intervention_favourites_user ON public.intervention_favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_intervention_favorites_user ON public.intervention_favorites(user_id);

ALTER TABLE public.intervention_favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favourites" ON public.intervention_favourites;
CREATE POLICY "Users manage own favourites" ON public.intervention_favourites
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own favorites" ON public.intervention_favorites;
CREATE POLICY "Users manage own favorites" ON public.intervention_favorites
    FOR ALL USING (auth.uid() = user_id);
