-- SQL Migration: Knowledge Intelligence Engine Schema V1
-- Run this in your Supabase SQL Editor.

-- 1. Create knowledge_events table
CREATE TABLE IF NOT EXISTS knowledge_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES cycles(id) ON DELETE SET NULL,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  version TEXT NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for event lookup
CREATE INDEX IF NOT EXISTS idx_knowledge_events_user_id ON knowledge_events(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_events_processed ON knowledge_events(processed);
CREATE INDEX IF NOT EXISTS idx_knowledge_events_event_type ON knowledge_events(event_type);

-- 2. Create knowledge_profile table
CREATE TABLE IF NOT EXISTS knowledge_profile (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  identity_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  emotion_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  vocabulary_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  pattern_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  agency_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  relationship_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  decision_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  growth_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  communication_model JSONB NOT NULL DEFAULT '{}'::jsonb,
  knowledge_version TEXT NOT NULL DEFAULT '1.0',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for profile lookup
CREATE INDEX IF NOT EXISTS idx_knowledge_profile_updated_at ON knowledge_profile(updated_at);

-- 3. Create knowledge_cards table
CREATE TABLE IF NOT EXISTS knowledge_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  json_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  version TEXT NOT NULL,
  generated_from_event UUID REFERENCES knowledge_events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for cards lookup
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_user_id ON knowledge_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_cards_card_type ON knowledge_cards(card_type);

-- 4. Create knowledge_snapshots table
CREATE TABLE IF NOT EXISTS knowledge_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for snapshots lookup
CREATE INDEX IF NOT EXISTS idx_knowledge_snapshots_user_id ON knowledge_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_snapshots_week_number ON knowledge_snapshots(week_number);
