-- Migration: Exercise Platform Check Constraint Alignment (Phase 2)
-- =========================================================================

ALTER TABLE public.exercise_instances DROP CONSTRAINT IF EXISTS exercise_instances_status_check;
ALTER TABLE public.exercise_instances ADD CONSTRAINT exercise_instances_status_check CHECK (status IN ('locked', 'available', 'started', 'in_progress', 'completed', 'queued', 'analysing', 'finished', 'failed', 'archived'));
