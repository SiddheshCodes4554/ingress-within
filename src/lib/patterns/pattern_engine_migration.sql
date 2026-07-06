-- =====================================================
-- PATTERN ENGINE — DATABASE MIGRATION
-- Run once in Supabase SQL editor
-- =====================================================

-- ── TABLE 1: pattern_extractions ──
-- One row per detected pattern occurrence from one source (entry / thread / vocab / report)
-- Append-only. Never modified after insert.
CREATE TABLE IF NOT EXISTS pattern_extractions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id          UUID        NOT NULL,
  entry_id          UUID,                           -- nullable: vocab/report sources may not have entry_id
  source_type       TEXT        NOT NULL CHECK (source_type IN ('journal', 'thread', 'vocab', 'weekly_report', 'assessment')),
  pattern_name      TEXT        NOT NULL,
  pattern_category  TEXT        NOT NULL CHECK (pattern_category IN ('emotional', 'linguistic', 'behavioural', 'relational')),
  supporting_phrase TEXT,                           -- the exact phrase/word from the source
  supporting_sentence TEXT,                         -- the full sentence for evidence
  confidence        NUMERIC(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  extractor_version TEXT        NOT NULL DEFAULT '1.0',
  prompt_version    TEXT        NOT NULL DEFAULT '1.0',
  provider          TEXT,                           -- 'openai' | 'anthropic' | 'google'
  model             TEXT,                           -- e.g. 'gpt-4o-mini'
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient per-user queries
CREATE INDEX IF NOT EXISTS idx_pattern_extractions_user_cycle
  ON pattern_extractions (user_id, cycle_id);

CREATE INDEX IF NOT EXISTS idx_pattern_extractions_user_pattern
  ON pattern_extractions (user_id, pattern_name);

CREATE INDEX IF NOT EXISTS idx_pattern_extractions_user_entry
  ON pattern_extractions (user_id, entry_id);

-- RLS
ALTER TABLE pattern_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pattern extractions"
  ON pattern_extractions FOR SELECT
  USING (auth.uid() = user_id);

-- Server-side only insert (service role key bypasses RLS)
-- No user-facing insert/update/delete policies

-- ── TABLE 2: pattern_snapshots ──
-- One row per (user_id, cycle_id).
-- Active cycle row is updated incrementally.
-- Completed cycle rows are NEVER modified after snapshot_status = 'completed'.
CREATE TABLE IF NOT EXISTS pattern_snapshots (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id         UUID        NOT NULL,
  cycle_number     INTEGER     NOT NULL,
  snapshot_status  TEXT        NOT NULL DEFAULT 'active' CHECK (snapshot_status IN ('active', 'completed')),
  snapshot_data    JSONB       NOT NULL DEFAULT '{}',
  -- snapshot_data structure:
  -- {
  --   "patterns": [
  --     {
  --       "name": "Avoidance",
  --       "category": "behavioural",
  --       "status": "present" | "shifting" | "quiet" | "new" | "returned" | "absent",
  --       "internal_status": "emerging" | "growing" | "established" | "changing" | "quiet" | "archived",
  --       "cycle_state": "strong" | "shifting" | "quiet" | "absent" | "new" | "returned",
  --       "occurrences_this_cycle": 12,
  --       "first_seen_cycle": 1,
  --       "last_seen_cycle": 12,
  --       "total_occurrences": 89,
  --       "orientation": "...",        -- one-sentence longitudinal observation
  --       "connected_patterns": ["Conflict aversion", "Saying fine"],
  --       "evidence": [
  --         { "quote": "...", "entry_id": "uuid", "date": "2026-05-07", "cycle_day": 3 }
  --       ]
  --     }
  --   ],
  --   "timeline": {
  --     "Avoidance": ["strong","strong","shifting","quiet"]   -- one entry per historical cycle
  --   },
  --   "summary": { "present": 2, "shifting": 2, "quiet": 2, "new": 1, "returned": 0 },
  --   "total_cycles_observed": 2
  -- }
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  extractor_version TEXT        NOT NULL DEFAULT '1.0',

  UNIQUE (user_id, cycle_id)
);

CREATE INDEX IF NOT EXISTS idx_pattern_snapshots_user
  ON pattern_snapshots (user_id);

CREATE INDEX IF NOT EXISTS idx_pattern_snapshots_user_status
  ON pattern_snapshots (user_id, snapshot_status);

-- RLS
ALTER TABLE pattern_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pattern snapshots"
  ON pattern_snapshots FOR SELECT
  USING (auth.uid() = user_id);

-- ── GRANT service_role access ──
GRANT ALL ON pattern_extractions TO service_role;
GRANT ALL ON pattern_snapshots TO service_role;
GRANT ALL ON pattern_extractions TO authenticated;
GRANT ALL ON pattern_snapshots TO authenticated;
