-- Ingress Within Database Migration - Refined Vocabulary Engine (v4.0)
-- =========================================================================

-- 1. Alter vocab_words table to add emotional classification columns
ALTER TABLE public.vocab_words 
    ADD COLUMN IF NOT EXISTS is_emotional BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS emotional_score DOUBLE PRECISION DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS raw_tokens TEXT[];

-- Create an index to optimize user-facing queries filtering by emotional vocabulary
CREATE INDEX IF NOT EXISTS idx_vocab_words_is_emotional ON public.vocab_words(user_id, cycle_id, is_emotional);

-- 2. Backfill existing records: classify core emotional lemmas as emotional vocabulary
UPDATE public.vocab_words 
SET is_emotional = true, 
    emotional_score = 1.0,
    raw_tokens = ARRAY[word]
WHERE normalized_word IN (
    'sad', 'unhappy', 'grief', 'cry', 'pain', 'hurt', 'sorrow', 'depressed', 'depression', 'blue', 'heavy',
    'happy', 'joy', 'cheerful', 'excited', 'content', 'peace', 'peaceful', 'calm', 'relaxed', 'relieved', 'gratitude', 'grateful',
    'angry', 'rage', 'mad', 'furious', 'irritated', 'annoyed', 'frustrate', 'bitter', 'resent', 'resentful',
    'fear', 'anxious', 'worry', 'panic', 'dread', 'terrified', 'frightened', 'nervous',
    'shame', 'ashamed', 'guilty', 'embarrassed', 'regret', 'remorse',
    'lonely', 'isolated', 'abandoned', 'alone', 'empty',
    'overwhelm', 'exhaust', 'tired', 'weary', 'drained', 'depleted', 'fatigue', 'burden', 'pressure', 'stress', 'tense',
    'confuse', 'uncertain', 'doubt', 'lost', 'stuck', 'blocked', 'trapped', 'hopeless', 'helpless', 'powerless', 'defeated',
    'avoid', 'numb', 'hiding', 'withdrawn', 'numbness', 'distracted', 'escape',
    'focus', 'clear', 'mindful', 'grounded', 'motivated', 'inspired', 'confident', 'worth', 'worthy',
    'longing', 'yearning', 'craving', 'need', 'desire'
);
