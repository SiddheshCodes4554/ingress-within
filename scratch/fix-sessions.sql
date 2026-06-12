-- ========================================================
-- SESSION ARCHITECTURE FIX & CLEANUP
-- Run this in your Supabase SQL Editor
-- ========================================================

-- 1. Deactivate duplicate active user sessions, keeping only the most recently active session
WITH ranked_sessions AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY user_id, device_id 
               ORDER BY expires_at DESC, id DESC
           ) as rn
    FROM public.user_sessions
    WHERE is_active = true
)
UPDATE public.user_sessions
SET is_active = false
WHERE id IN (
    SELECT id 
    FROM ranked_sessions 
    WHERE rn > 1
);

-- 2. Create a unique partial index to guarantee at most one active session per user + device
DROP INDEX IF EXISTS uq_active_user_device_session;
CREATE UNIQUE INDEX uq_active_user_device_session 
ON public.user_sessions (user_id, device_id) 
WHERE (is_active = true);
