-- Ingress Within Reflection Answer Migration (v2.6)
-- Run this in the Supabase SQL Editor to support the new Reflection Response UX

-- 1. Drop existing status check constraint if it exists to allow updating the list of allowed statuses
ALTER TABLE public.reflections 
DROP CONSTRAINT IF EXISTS reflections_status_check;

-- 2. Add new columns for reflection answer and answered timestamp
ALTER TABLE public.reflections 
ADD COLUMN IF NOT EXISTS reflection_answer TEXT,
ADD COLUMN IF NOT EXISTS answered_at TIMESTAMP WITH TIME ZONE;

-- 3. Re-add status check constraint supporting 'completed' state
ALTER TABLE public.reflections 
ADD CONSTRAINT reflections_status_check 
CHECK (status IN ('pending', 'ready', 'failed', 'completed'));

-- 4. Verify columns exist (for audit/observability)
COMMENT ON COLUMN public.reflections.reflection_answer IS 'The decrypted text of the user response to the reflection question';
COMMENT ON COLUMN public.reflections.answered_at IS 'The timestamp when the user submitted their reflection response';
