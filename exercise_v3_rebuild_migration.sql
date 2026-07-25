-- =========================================================================
-- Migration: Exercise Engine Rebuild V3 Foundation
-- Database: Supabase / PostgreSQL
-- System: Ingress Within — Exercise & Assessment Subsystem V3
-- =========================================================================

-- 1. Ensure exercise_definitions table has display_configuration and prompt_configuration
ALTER TABLE public.exercise_definitions ADD COLUMN IF NOT EXISTS display_configuration JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.exercise_definitions ADD COLUMN IF NOT EXISTS prompt_configuration JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Add lifecycle timestamp columns to exercise_instances
ALTER TABLE public.exercise_instances ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.exercise_instances ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE public.exercise_instances ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.exercise_instances ADD COLUMN IF NOT EXISTS analysis_completed_at TIMESTAMPTZ;

-- 3. DROP old check constraint FIRST so legacy status updates are allowed without constraint errors
ALTER TABLE public.exercise_instances DROP CONSTRAINT IF EXISTS exercise_instances_status_check;

-- 4. Normalize legacy status values in exercise_instances
UPDATE public.exercise_instances SET status = 'result_available' WHERE status IN ('finished');
UPDATE public.exercise_instances SET status = 'processing' WHERE status IN ('analysing');
UPDATE public.exercise_instances SET status = 'in_progress' WHERE status IN ('started', 'draft');

-- Safety fallback for any unrecognized legacy status string
UPDATE public.exercise_instances 
SET status = 'available' 
WHERE status NOT IN ('locked', 'available', 'started', 'in_progress', 'submitted', 'queued', 'processing', 'completed', 'result_available', 'failed', 'archived');

-- 5. NOW apply the new updated V3 status check constraint to exercise_instances
ALTER TABLE public.exercise_instances ADD CONSTRAINT exercise_instances_status_check 
  CHECK (status IN ('locked', 'available', 'started', 'in_progress', 'submitted', 'queued', 'processing', 'completed', 'result_available', 'failed', 'archived'));

-- 6. Create exercise_analysis table (Immutable single-row result per instance)
CREATE TABLE IF NOT EXISTS public.exercise_analysis (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id          UUID        NOT NULL UNIQUE REFERENCES public.exercise_instances(id) ON DELETE CASCADE,
    user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id          TEXT        NOT NULL,
    cycle_id             UUID        REFERENCES public.cycles(id) ON DELETE SET NULL,
    analysis             TEXT        NOT NULL,
    scores               JSONB       NOT NULL DEFAULT '{}'::jsonb,
    summary              TEXT,
    branch               TEXT,
    lens                 TEXT,
    gap_score            NUMERIC,
    provider             TEXT        NOT NULL DEFAULT 'gemini',
    model                TEXT        NOT NULL DEFAULT 'gemini-3.1-flash-lite',
    prompt_version       TEXT        NOT NULL DEFAULT 'v1',
    engine_version       TEXT        NOT NULL DEFAULT '3.0',
    raw_json             JSONB       NOT NULL DEFAULT '{}'::jsonb,
    execution_time_ms    INTEGER     DEFAULT 0,
    generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for exercise_analysis
CREATE INDEX IF NOT EXISTS idx_exercise_analysis_instance ON public.exercise_analysis(instance_id);
CREATE INDEX IF NOT EXISTS idx_exercise_analysis_user ON public.exercise_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_analysis_user_instance ON public.exercise_analysis(user_id, instance_id);

-- Enable RLS for exercise_analysis
ALTER TABLE public.exercise_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own exercise analysis" ON public.exercise_analysis;
CREATE POLICY "Users can read own exercise analysis" ON public.exercise_analysis
    FOR SELECT USING (auth.uid() = user_id);

-- 7. Create exercise_jobs table (Durable Postgres Job Queue for Vercel execution)
CREATE TABLE IF NOT EXISTS public.exercise_jobs (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id       UUID        NOT NULL REFERENCES public.exercise_instances(id) ON DELETE CASCADE,
    user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id       TEXT        NOT NULL,
    cycle_id          UUID        REFERENCES public.cycles(id) ON DELETE SET NULL,
    status            TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')),
    retry_count       INTEGER     NOT NULL DEFAULT 0,
    max_retries       INTEGER     NOT NULL DEFAULT 3,
    last_error        TEXT,
    payload           JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at      TIMESTAMPTZ
);

-- Indexing for exercise_jobs
CREATE INDEX IF NOT EXISTS idx_exercise_jobs_instance ON public.exercise_jobs(instance_id);
CREATE INDEX IF NOT EXISTS idx_exercise_jobs_user ON public.exercise_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_jobs_status ON public.exercise_jobs(status);

-- Enable RLS for exercise_jobs
ALTER TABLE public.exercise_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own exercise jobs" ON public.exercise_jobs;
CREATE POLICY "Users can read own exercise jobs" ON public.exercise_jobs
    FOR SELECT USING (auth.uid() = user_id);

-- 8. Backfill exercise_analysis from existing exercise_results if present
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exercise_results') THEN
        INSERT INTO public.exercise_analysis (
            instance_id, user_id, exercise_id, cycle_id, analysis, scores, summary, branch, lens, gap_score, provider, model, prompt_version, engine_version, raw_json, generated_at
        )
        SELECT 
            r.instance_id,
            r.user_id,
            COALESCE(i.exercise_id, 'exercise_0'),
            i.cycle_id,
            r.analysis,
            r.scores,
            r.summary,
            r.branch,
            r.lens,
            r.gap_score,
            r.provider,
            r.model,
            COALESCE(r.prompt_version, 'v1'),
            '3.0',
            COALESCE(r.raw_json, '{}'::jsonb),
            r.generated_at
        FROM public.exercise_results r
        JOIN public.exercise_instances i ON i.id = r.instance_id
        ON CONFLICT (instance_id) DO NOTHING;
    END IF;
END $$;

-- Grant privileges for service_role and authenticated users
GRANT ALL ON public.exercise_analysis TO service_role;
GRANT ALL ON public.exercise_jobs TO service_role;
GRANT ALL ON public.exercise_analysis TO authenticated;
GRANT ALL ON public.exercise_jobs TO authenticated;
