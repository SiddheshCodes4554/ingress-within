-- SQL Migration: Knowledge Intelligence Engine Backfill Progress Schema
-- Run this in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.knowledge_backfill_status (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  current_step TEXT DEFAULT NULL,
  processed_events INTEGER DEFAULT 0,
  remaining_events INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  error_message TEXT DEFAULT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.knowledge_backfill_status ENABLE ROW LEVEL SECURITY;

-- Create policy for select access
DROP POLICY IF EXISTS "Allow authenticated read" ON public.knowledge_backfill_status;
CREATE POLICY "Allow authenticated read" ON public.knowledge_backfill_status
  FOR SELECT USING (true);
