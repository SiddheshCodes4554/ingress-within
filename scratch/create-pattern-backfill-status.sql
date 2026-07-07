-- ========================================================
-- SCHEMA FOR PATTERN ENGINE BACKFILL STATUS
-- ========================================================

CREATE TABLE IF NOT EXISTS public.pattern_backfill_status (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('NOT_STARTED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')) DEFAULT 'NOT_STARTED',
    progress_total_cycles INTEGER NOT NULL DEFAULT 0,
    progress_processed_cycles INTEGER NOT NULL DEFAULT 0,
    progress_total_entries INTEGER NOT NULL DEFAULT 0,
    progress_processed_entries INTEGER NOT NULL DEFAULT 0,
    snapshot_created BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    queued_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.pattern_backfill_status ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "Users can view their own backfill status" ON public.pattern_backfill_status;
CREATE POLICY "Users can view their own backfill status" ON public.pattern_backfill_status
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own backfill status" ON public.pattern_backfill_status;
CREATE POLICY "Users can insert their own backfill status" ON public.pattern_backfill_status
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own backfill status" ON public.pattern_backfill_status;
CREATE POLICY "Users can update their own backfill status" ON public.pattern_backfill_status
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS trigger_pattern_backfill_status_updated_at ON public.pattern_backfill_status;
CREATE TRIGGER trigger_pattern_backfill_status_updated_at
    BEFORE UPDATE ON public.pattern_backfill_status
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
