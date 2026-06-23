-- Ingress Within: Cycle Engine Schema Migration (v2.7)
-- Run this in the Supabase SQL Editor to align the cycles table

-- 1. Rename existing columns if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cycles' AND column_name = 'number') THEN
    ALTER TABLE public.cycles RENAME COLUMN number TO cycle_number;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cycles' AND column_name = 'started_at') THEN
    ALTER TABLE public.cycles RENAME COLUMN started_at TO start_date;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cycles' AND column_name = 'ended_at') THEN
    ALTER TABLE public.cycles RENAME COLUMN ended_at TO end_date;
  END IF;
END $$;

-- 2. Add new columns for tracking metrics and gating
ALTER TABLE public.cycles 
  ADD COLUMN IF NOT EXISTS current_day INTEGER DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS days_completed INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS entries_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS assessment_completed BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS assessment_available BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- 3. Recreate constraints to allow uppercase statuses
ALTER TABLE public.cycles DROP CONSTRAINT IF EXISTS cycles_status_check;
ALTER TABLE public.cycles DROP CONSTRAINT IF EXISTS cycles_status_check1;

-- 4. Update existing statuses to uppercase
UPDATE public.cycles SET status = 'ACTIVE' WHERE status = 'active';
UPDATE public.cycles SET status = 'COMPLETED' WHERE status = 'complete';
UPDATE public.cycles SET status = 'COMPLETED' WHERE status = 'completed';

-- 5. Add new check constraint and adjust default status
ALTER TABLE public.cycles ADD CONSTRAINT cycles_status_check CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED'));
ALTER TABLE public.cycles ALTER COLUMN status SET DEFAULT 'ACTIVE';
