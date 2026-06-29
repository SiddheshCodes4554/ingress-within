-- Ingress Within Database Migration - Categorized Vocabulary Engine (v5.0)
-- =========================================================================

-- 1. Alter vocab_words table to add category column (defaults to 'general')
ALTER TABLE public.vocab_words 
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Create index to optimize user-facing queries filtering by category
CREATE INDEX IF NOT EXISTS idx_vocab_words_category ON public.vocab_words(user_id, cycle_id, category);

-- 2. Backfill existing records: set category to 'emotional' if is_emotional is true
UPDATE public.vocab_words 
SET category = 'emotional' 
WHERE is_emotional = true;

-- Set category to 'theme' for common deterministic theme words
UPDATE public.vocab_words 
SET category = 'theme' 
WHERE is_emotional = false 
  AND normalized_word IN (
    'work', 'job', 'career', 'project', 'task', 'office', 'meeting', 'business', 'schedule', 'planning',
    'growth', 'grow', 'improve', 'improvement', 'habit', 'routine', 'practice', 'learn', 'learning', 'lesson', 'study', 'focus', 'clear', 'mindful', 'grounded',
    'goal', 'priority', 'achievement', 'success', 'commit', 'commitment', 'motivated', 'inspired', 'confident', 'worth', 'worthy', 'progress', 'step', 'consistency',
    'relationship', 'friend', 'family', 'partner', 'boundary', 'boundaries', 'people', 'person', 'identity', 'value', 'values'
  );
