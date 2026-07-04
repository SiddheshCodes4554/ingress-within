-- ========================================================
-- DATABASE MIGRATION: WEEKLY REPORT STATE MACHINE & VERSIONING
-- ========================================================

-- 1. Drop the old check constraint on status column FIRST to allow temporary value changes
ALTER TABLE public.weekly_summaries DROP CONSTRAINT IF EXISTS weekly_summaries_status_check;

-- 2. Migrate existing statuses in weekly_summaries to uppercase
UPDATE public.weekly_summaries SET status = UPPER(status);

-- 3. Add the new check constraint supporting the expanded state machine (uppercase only)
ALTER TABLE public.weekly_summaries ADD CONSTRAINT weekly_summaries_status_check 
    CHECK (status IN ('PENDING', 'WAITING_FOR_PROCESSING', 'GRACE_PERIOD', 'GENERATING', 'READY', 'FAILED'));

-- 4. Add prompt_version to weekly_summaries
ALTER TABLE public.weekly_summaries ADD COLUMN IF NOT EXISTS prompt_version TEXT NOT NULL DEFAULT '1.0';

-- 5. Add versioning columns to patterns
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS engine_version TEXT NOT NULL DEFAULT '1.0';
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS prompt_version TEXT NOT NULL DEFAULT '1.0';
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- 6. Add versioning columns to assessments
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS engine_version TEXT NOT NULL DEFAULT '1.0';
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS prompt_version TEXT NOT NULL DEFAULT '1.0';
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- 7. Add versioning columns to exercises
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS engine_version TEXT NOT NULL DEFAULT '1.0';
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS prompt_version TEXT NOT NULL DEFAULT '1.0';
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- 8. Create user_intelligence_versions table to track multi-tenant upgrades
CREATE TABLE IF NOT EXISTS public.user_intelligence_versions (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    vocab_engine_version TEXT NOT NULL DEFAULT '1.0',
    vocab_prompt_version TEXT NOT NULL DEFAULT '1.0',
    reports_engine_version TEXT NOT NULL DEFAULT '1.0',
    reports_prompt_version TEXT NOT NULL DEFAULT '1.0',
    patterns_engine_version TEXT NOT NULL DEFAULT '1.0',
    patterns_prompt_version TEXT NOT NULL DEFAULT '1.0',
    assessment_engine_version TEXT NOT NULL DEFAULT '1.0',
    assessment_prompt_version TEXT NOT NULL DEFAULT '1.0',
    exercise_engine_version TEXT NOT NULL DEFAULT '1.0',
    exercise_prompt_version TEXT NOT NULL DEFAULT '1.0',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS on user_intelligence_versions
ALTER TABLE public.user_intelligence_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_intelligence_versions
CREATE POLICY "Users can manage their own intelligence versions" ON public.user_intelligence_versions
    FOR ALL USING (auth.uid() = user_id);
