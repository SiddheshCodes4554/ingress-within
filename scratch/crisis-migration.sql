-- Start Transaction
BEGIN;

-- 1. Extend ENTRIES table with crisis columns
ALTER TABLE public.entries
    ADD COLUMN IF NOT EXISTS crisis_flag BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS crisis_type TEXT CHECK (crisis_type IN ('Immediate', 'Sustained', 'Risk_Language')),
    ADD COLUMN IF NOT EXISTS crisis_flagged_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS reflection_suppressed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS risk_language_quote TEXT,
    ADD COLUMN IF NOT EXISTS crisis_checked BOOLEAN DEFAULT false;

-- 2. Extend USERS table with sustained distress columns
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS sustained_distress_flag BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS sustained_distress_since DATE,
    ADD COLUMN IF NOT EXISTS sustained_distress_cleared_at DATE;

-- 3. Create CRISIS_LOG table
CREATE TABLE IF NOT EXISTS public.crisis_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    crisis_type TEXT NOT NULL CHECK (crisis_type IN ('Immediate', 'Sustained', 'Risk_Language')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable RLS on crisis_log
ALTER TABLE public.crisis_log ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for crisis_log
CREATE POLICY "Users can view their own crisis logs" ON public.crisis_log
    FOR SELECT USING (auth.uid() = user_id);

COMMIT;
