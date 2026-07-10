-- =====================================================
-- KNOWLEDGE RELATIONSHIP GRAPH — SCHEMA MIGRATION
-- Run once in Supabase SQL editor
-- =====================================================

-- 1. Create knowledge_relationships table
CREATE TABLE IF NOT EXISTS knowledge_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_node TEXT NOT NULL,
  source_type TEXT NOT NULL, -- e.g. Emotion, Vocabulary, Behaviour, Pattern, Situation, Work, Recovery, Decision, Stress Trigger
  target_node TEXT NOT NULL,
  target_type TEXT NOT NULL,
  relationship_type TEXT NOT NULL, -- e.g. Leads To, Associated With, Strengthens, Recovered By
  strength NUMERIC NOT NULL DEFAULT 0.5, -- scale 0.0 to 1.0
  confidence TEXT NOT NULL DEFAULT 'Low', -- High, Medium, Low
  supporting_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  supporting_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  supporting_reports JSONB NOT NULL DEFAULT '[]'::jsonb,
  supporting_patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, source_node, target_node, relationship_type)
);

-- Indexing for fast BFS graph search and queries
CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_user_id ON knowledge_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_source ON knowledge_relationships(user_id, source_node);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_target ON knowledge_relationships(user_id, target_node);

-- 2. Extend knowledge_cards with referenced_nodes
ALTER TABLE knowledge_cards ADD COLUMN IF NOT EXISTS referenced_nodes JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Comment fields
COMMENT ON TABLE knowledge_relationships IS 'Stores evolutionary concept relationship edges for the Knowledge Relationship Graph';
COMMENT ON COLUMN knowledge_relationships.source_node IS 'Concept node at the start of the edge';
COMMENT ON COLUMN knowledge_relationships.target_node IS 'Concept node at the end of the edge';
COMMENT ON COLUMN knowledge_relationships.relationship_type IS 'Descriptive edge label (e.g. Leads To, Weakens)';
COMMENT ON COLUMN knowledge_relationships.strength IS 'Observed relationship strength multiplier (0.0 to 1.0)';
