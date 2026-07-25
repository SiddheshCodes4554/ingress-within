-- Exercise System V4 Database Schema Migration

-- 1. Exercise Definitions Table
CREATE TABLE IF NOT EXISTS public.exercise_definitions (
  id VARCHAR(100) PRIMARY KEY,
  exercise_type VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unlock_rules JSONB DEFAULT '{}'::jsonb,
  cycle INT DEFAULT 1,
  frequency VARCHAR(50) DEFAULT 'once_per_cycle',
  estimated_duration INT DEFAULT 5,
  version VARCHAR(20) DEFAULT '1.0',
  active_status BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Exercise Instances Table
CREATE TABLE IF NOT EXISTS public.exercise_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.cycles(id) ON DELETE CASCADE,
  exercise_id VARCHAR(100) NOT NULL REFERENCES public.exercise_definitions(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('locked', 'available', 'started', 'in_progress', 'submitted', 'processing', 'completed')),
  unlock_time TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  version VARCHAR(20) DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_exercise_instance UNIQUE (user_id, cycle_id, exercise_id)
);

-- 3. Exercise Responses Table
CREATE TABLE IF NOT EXISTS public.exercise_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.exercise_instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id VARCHAR(100) NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_exercise_response UNIQUE (instance_id, question_id)
);

-- 4. Exercise Results Table
CREATE TABLE IF NOT EXISTS public.exercise_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.exercise_instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exercise_id VARCHAR(100) NOT NULL REFERENCES public.exercise_definitions(id) ON DELETE CASCADE,
  summary TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  version VARCHAR(20) DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_exercise_result UNIQUE (instance_id, version)
);

-- 5. Exercise Events Table
CREATE TABLE IF NOT EXISTS public.exercise_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES public.exercise_instances(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_instances_user_cycle ON public.exercise_instances(user_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_exercise_instances_status ON public.exercise_instances(status);
CREATE INDEX IF NOT EXISTS idx_exercise_responses_instance ON public.exercise_responses(instance_id);
CREATE INDEX IF NOT EXISTS idx_exercise_results_instance ON public.exercise_results(instance_id);
CREATE INDEX IF NOT EXISTS idx_exercise_events_user ON public.exercise_events(user_id);
