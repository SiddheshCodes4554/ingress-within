-- Migration: Engine Health Monitoring (Step 5)
-- =========================================================================

-- 1. Add health and telemetry tracking columns to engine_state table
ALTER TABLE public.engine_state ADD COLUMN IF NOT EXISTS next_due TIMESTAMPTZ;
ALTER TABLE public.engine_state ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE public.engine_state ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.engine_state ADD COLUMN IF NOT EXISTS duration INTEGER;
