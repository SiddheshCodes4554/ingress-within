-- ========================================================
-- INGRESS WITHIN DATABASE SCHEMA ALIGNMENT MIGRATION
-- This script aligns the database with System Specification v2.0
-- and Implementation Guide v3.0, while migrating legacy data.
-- ========================================================

-- Start Transaction
BEGIN;

-- ==========================================
-- 1. EXTEND USERS TABLE
-- ==========================================
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    ADD COLUMN IF NOT EXISTS onboarding_done BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS crisis_flag_active BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS crisis_flagged_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS ocean_openness NUMERIC(3,2),
    ADD COLUMN IF NOT EXISTS ocean_conscientiousness NUMERIC(3,2),
    ADD COLUMN IF NOT EXISTS ocean_extraversion NUMERIC(3,2),
    ADD COLUMN IF NOT EXISTS ocean_agreeableness NUMERIC(3,2),
    ADD COLUMN IF NOT EXISTS ocean_neuroticism NUMERIC(3,2),
    ADD COLUMN IF NOT EXISTS personality_profile_json JSONB,
    ADD COLUMN IF NOT EXISTS personality_summary_text TEXT,
    ADD COLUMN IF NOT EXISTS patterns_summary_text TEXT,
    ADD COLUMN IF NOT EXISTS reports_last_viewed_at TIMESTAMP WITH TIME ZONE;

-- ==========================================
-- 2. CREATE AUTH_ACCOUNTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.auth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==========================================
-- 3. CREATE CYCLES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    started_at DATE NOT NULL,
    ended_at DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','complete')),
    total_days INTEGER NOT NULL DEFAULT 30,
    insight TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(user_id, number)
);

-- ==========================================
-- 4. MIGRATE AND EXTEND JOURNAL_ENTRIES TO ENTRIES
-- ==========================================
-- A. Drop constraint on daily_sessions first to allow table rename
ALTER TABLE public.daily_sessions 
    DROP CONSTRAINT IF EXISTS fk_daily_sessions_journal_entry,
    DROP CONSTRAINT IF EXISTS daily_sessions_journal_entry_id_fkey;

-- B. Rename table journal_entries to entries
ALTER TABLE public.journal_entries RENAME TO entries;

-- C. Add missing columns to entries table
ALTER TABLE public.entries 
    ADD COLUMN IF NOT EXISTS client_id UUID UNIQUE,
    ADD COLUMN IF NOT EXISTS cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS cycle_day INTEGER CHECK (cycle_day BETWEEN 1 AND 30),
    ADD COLUMN IF NOT EXISTS reflection_text_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS reflection_text_iv TEXT,
    ADD COLUMN IF NOT EXISTS new_entry_text_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS new_entry_text_iv TEXT,
    ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'new_only' CHECK (entry_type IN ('both','new_only','reflection_only','empty')),
    ADD COLUMN IF NOT EXISTS written_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS mode TEXT CHECK (mode IN ('fresh','continue','question')),
    ADD COLUMN IF NOT EXISTS thread_response BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS open_thread_id UUID, -- Foreign key constraint added after open_threads table creation
    ADD COLUMN IF NOT EXISTS exercise_id UUID,    -- Foreign key constraint added after exercises table creation
    ADD COLUMN IF NOT EXISTS reflection_ei NUMERIC(4,2),
    ADD COLUMN IF NOT EXISTS reflection_pr NUMERIC(4,2),
    ADD COLUMN IF NOT EXISTS reflection_sa NUMERIC(4,2),
    ADD COLUMN IF NOT EXISTS new_entry_ei NUMERIC(4,2),
    ADD COLUMN IF NOT EXISTS new_entry_pr NUMERIC(4,2),
    ADD COLUMN IF NOT EXISTS new_entry_sa NUMERIC(4,2),
    ADD COLUMN IF NOT EXISTS day_ei NUMERIC(4,2),
    ADD COLUMN IF NOT EXISTS day_pr NUMERIC(4,2),
    ADD COLUMN IF NOT EXISTS day_sa NUMERIC(4,2),
    ADD COLUMN IF NOT EXISTS confidence_flag BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS confidence_reason TEXT,
    ADD COLUMN IF NOT EXISTS scoring_status TEXT DEFAULT 'pending' CHECK (scoring_status IN ('pending','scored','failed'));

-- D. Populate client_id and written_at for existing entries
UPDATE public.entries 
SET client_id = gen_random_uuid() 
WHERE client_id IS NULL;

UPDATE public.entries 
SET written_at = created_at 
WHERE written_at IS NULL;

-- E. Backfill default active cycles for existing users
INSERT INTO public.cycles (user_id, number, started_at, status)
SELECT DISTINCT user_id, 1, COALESCE(MIN(created_at)::date, CURRENT_DATE), 'active'
FROM public.entries
GROUP BY user_id
ON CONFLICT (user_id, number) DO NOTHING;

-- F. Link existing entries to the default cycle
UPDATE public.entries e
SET cycle_id = c.id,
    cycle_day = GREATEST(1, LEAST(30, (e.written_at::date - c.started_at) + 1))
FROM public.cycles c
WHERE e.user_id = c.user_id AND e.cycle_id IS NULL;

-- ==========================================
-- 5. CREATE ENTRY_SCORES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.entry_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    reflection_ei NUMERIC(4,2),
    reflection_pr NUMERIC(4,2),
    reflection_sa NUMERIC(4,2),
    new_entry_ei NUMERIC(4,2),
    new_entry_pr NUMERIC(4,2),
    new_entry_sa NUMERIC(4,2),
    day_ei NUMERIC(4,2),
    day_pr NUMERIC(4,2),
    day_sa NUMERIC(4,2),
    confidence_flag BOOLEAN DEFAULT false,
    confidence_reason TEXT,
    scoring_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (scoring_status IN ('pending', 'scored', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==========================================
-- 6. CREATE REFLECTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE UNIQUE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    observation TEXT,
    question TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready','failed')),
    generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==========================================
-- 7. CREATE WEEKLY_SUMMARIES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.weekly_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 4),
    day_start INTEGER NOT NULL,
    day_end INTEGER NOT NULL,
    body TEXT,
    open_question TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready','failed')),
    is_pinned BOOLEAN NOT NULL DEFAULT true,
    generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(cycle_id, week_number)
);

-- ==========================================
-- 8. CREATE OPEN_THREADS TABLE & MIGRATE LEGACY DATA
-- ==========================================
CREATE TABLE IF NOT EXISTS public.open_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    source_summary_id UUID REFERENCES public.weekly_summaries(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    origin_context TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','addressed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    addressed_at TIMESTAMP WITH TIME ZONE,
    addressed_entry_id UUID REFERENCES public.entries(id) ON DELETE SET NULL
);

-- Link open_thread_id constraint to entries
ALTER TABLE public.entries 
    ADD CONSTRAINT fk_entries_open_thread FOREIGN KEY (open_thread_id) REFERENCES public.open_threads(id) ON DELETE SET NULL;

-- Migrate legacy threads to open_threads
INSERT INTO public.open_threads (id, user_id, cycle_id, question, origin_context, status, created_at, addressed_at)
SELECT 
    t.id,
    t.user_id,
    c.id as cycle_id,
    t.question,
    t.origin as origin_context,
    CASE WHEN t.status = 'CLOSED' THEN 'addressed' ELSE 'open' END as status,
    t.created_at,
    t.closed_at as addressed_at
FROM public.threads t
JOIN public.cycles c ON c.user_id = t.user_id;

-- Migrate legacy thread_responses to entries
INSERT INTO public.entries (id, client_id, user_id, cycle_id, cycle_day, content, entry_type, word_count, written_at, thread_response, open_thread_id)
SELECT 
    tr.id,
    tr.id as client_id,
    tr.user_id,
    c.id as cycle_id,
    1 as cycle_day,
    tr.response as content,
    'new_only' as entry_type,
    cardinality(regexp_split_to_array(tr.response, '\s+')) as word_count,
    tr.created_at as written_at,
    true as thread_response,
    tr.thread_id as open_thread_id
FROM public.thread_responses tr
JOIN public.cycles c ON c.user_id = tr.user_id;

-- Update addressed_entry_id in open_threads
UPDATE public.open_threads ot
SET addressed_entry_id = (
    SELECT id FROM public.entries e 
    WHERE e.open_thread_id = ot.id 
    ORDER BY e.written_at DESC 
    LIMIT 1
)
WHERE status = 'addressed';

-- ==========================================
-- 9. CREATE EXERCISES & TEMPLATES & MIGRATE LEGACY DATA
-- ==========================================
CREATE TABLE IF NOT EXISTS public.exercise_templates (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('write','reflect','sort')),
    theme_tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    cycle_day INTEGER NOT NULL,
    template_id TEXT NOT NULL REFERENCES public.exercise_templates(id) ON DELETE RESTRICT,
    surfaced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    response_encrypted TEXT,
    response_iv TEXT,
    insight_note TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Link exercises to entries
ALTER TABLE public.entries 
    ADD CONSTRAINT fk_entries_exercise FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE SET NULL;

-- Seed default CBT reframing template
INSERT INTO public.exercise_templates (id, title, prompt, type, theme_tags)
VALUES (
    'cbt_reframing', 
    'Cognitive Reframing Exercise', 
    'Reframing negative automated thoughts into constructive and objective thoughts.', 
    'write', 
    '{"CBT", "Reframing"}'
) ON CONFLICT (id) DO NOTHING;

-- Migrate legacy user_exercises to exercises
INSERT INTO public.exercises (id, user_id, cycle_id, cycle_day, template_id, surfaced_at, completed_at, response_encrypted, insight_note, status, created_at)
SELECT 
    ue.id,
    ue.user_id,
    c.id as cycle_id,
    1 as cycle_day,
    'cbt_reframing' as template_id,
    ue.created_at as surfaced_at,
    ue.created_at as completed_at,
    json_build_object(
        'stressor_type', ue.stressor_type,
        'reactive_thought', ue.reactive_thought,
        'reframed_thought', ue.reframed_thought,
        'clarity_score', ue.clarity_score
    )::text as response_encrypted,
    'Migrated legacy CBT reframing data.' as insight_note,
    'completed' as status,
    ue.created_at
FROM public.user_exercises ue
JOIN public.cycles c ON c.user_id = ue.user_id;

-- ==========================================
-- 10. RE-LINK DAILY_SESSIONS TO NEW TABLES
-- ==========================================
ALTER TABLE public.daily_sessions 
    DROP CONSTRAINT IF EXISTS daily_sessions_exercise_id_fkey,
    DROP CONSTRAINT IF EXISTS fk_daily_sessions_exercise;

ALTER TABLE public.daily_sessions 
    ADD CONSTRAINT fk_daily_sessions_exercise 
    FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE SET NULL;

ALTER TABLE public.daily_sessions 
    ADD CONSTRAINT fk_daily_sessions_entry 
    FOREIGN KEY (journal_entry_id) REFERENCES public.entries(id) ON DELETE SET NULL;

-- ==========================================
-- 11. CREATE PATTERNS TABLES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    first_seen_cycle INTEGER NOT NULL,
    first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL,
    orientation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pattern_cycle_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_id UUID NOT NULL REFERENCES public.patterns(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    cycle_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present','shifting','gone_quiet','new','absent')),
    note TEXT NOT NULL,
    connected_to UUID[] NOT NULL DEFAULT '{}',
    entry_quote_1 TEXT,
    entry_quote_1_label TEXT,
    entry_quote_2 TEXT,
    entry_quote_2_label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(pattern_id, cycle_id)
);

-- ==========================================
-- 12. CREATE VOCABULARY TABLES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vocab_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    written_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.vocab_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
    anchor_word TEXT NOT NULL,
    related_words TEXT[] NOT NULL DEFAULT '{}',
    insight TEXT,
    total_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(user_id, cycle_id, anchor_word)
);

-- ==========================================
-- 13. CREATE ASSESSMENTS & MONTHLY SCORES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ei_avg NUMERIC(4,2) NOT NULL,
    pr_avg NUMERIC(4,2) NOT NULL,
    sa_avg NUMERIC(4,2) NOT NULL,
    dt_score NUMERIC(4,2) NOT NULL,
    normalised_sa NUMERIC(4,2) NOT NULL,
    risk_total INTEGER NOT NULL,
    path_assignment TEXT NOT NULL CHECK (path_assignment IN (
        'maintenance',
        'second_cycle',
        'professional_pathway_supported',
        'professional_pathway_referred'
    )),
    branch_assignment TEXT NOT NULL CHECK (branch_assignment IN ('A','B','C','D')),
    stability_gate_triggered BOOLEAN NOT NULL DEFAULT false,
    entry_count INTEGER NOT NULL,
    generation_status TEXT NOT NULL DEFAULT 'pending' CHECK (generation_status IN ('pending','ready','held','failed')),
    report_text TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    generated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.monthly_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    month_number INTEGER NOT NULL,
    window_start DATE NOT NULL,
    window_end DATE NOT NULL,
    ei_score NUMERIC(4,2) NOT NULL,
    pr_score NUMERIC(4,2) NOT NULL,
    sa_score NUMERIC(4,2) NOT NULL,
    dt_score NUMERIC(4,2) NOT NULL,
    ei_delta NUMERIC(4,2),
    pr_delta NUMERIC(4,2),
    sa_delta NUMERIC(4,2),
    dt_delta NUMERIC(4,2),
    primary_dimension TEXT NOT NULL CHECK (primary_dimension IN ('EI','PR','SA','both_EI_PR')),
    routing_action TEXT NOT NULL CHECK (routing_action IN (
        'advance','step_back','no_change','professional_nudge'
    )),
    professional_nudge_active BOOLEAN NOT NULL DEFAULT false,
    consecutive_worsening_count INTEGER NOT NULL DEFAULT 0,
    consecutive_improvement_count INTEGER NOT NULL DEFAULT 0,
    flag_spike_recovery BOOLEAN NOT NULL DEFAULT false,
    entry_count INTEGER NOT NULL,
    generation_status TEXT NOT NULL DEFAULT 'pending' CHECK (generation_status IN ('pending','ready','held','failed')),
    report_text TEXT,
    generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(user_id, month_number)
);

-- ==========================================
-- 14. CREATE AI_JOBS QUEUE TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==========================================
-- 15. CLEAN UP LEGACY TABLES
-- ==========================================
DROP TABLE IF EXISTS public.thread_responses;
DROP TABLE IF EXISTS public.threads;
DROP TABLE IF EXISTS public.user_exercises;

-- ==========================================
-- 16. DEFINE INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_entries_user_cycle ON public.entries(user_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_entries_open_thread ON public.entries(open_thread_id);
CREATE INDEX IF NOT EXISTS idx_entry_scores_lookup ON public.entry_scores(entry_id, user_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_reflections_entry ON public.reflections(entry_id);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_cycle ON public.weekly_summaries(cycle_id);
CREATE INDEX IF NOT EXISTS idx_open_threads_cycle ON public.open_threads(cycle_id);
CREATE INDEX IF NOT EXISTS idx_pattern_states ON public.pattern_cycle_states(pattern_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_vocab_words_user_cycle ON public.vocab_words(user_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_vocab_clusters_user_cycle ON public.vocab_clusters(user_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_polling ON public.ai_jobs(status, run_at);

-- ==========================================
-- 17. DEFINE ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================
-- Enable RLS
ALTER TABLE public.auth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_cycle_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can manage their own auth accounts" ON public.auth_accounts
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cycles" ON public.cycles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own entries" ON public.entries
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own entry scores" ON public.entry_scores
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view reflections on their entries" ON public.reflections
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.entries e WHERE e.id = reflections.entry_id AND e.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own weekly summaries" ON public.weekly_summaries
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own open threads" ON public.open_threads
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view templates" ON public.exercise_templates
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own exercise logs" ON public.exercises
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own patterns" ON public.patterns
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view pattern cycle states" ON public.pattern_cycle_states
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.patterns p WHERE p.id = pattern_cycle_states.pattern_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own vocab words" ON public.vocab_words
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own vocab clusters" ON public.vocab_clusters
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own assessments" ON public.assessments
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own monthly scores" ON public.monthly_scores
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Commit Migration
COMMIT;
