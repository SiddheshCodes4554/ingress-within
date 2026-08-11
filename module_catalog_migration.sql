-- SQL Migration: Psychoeducation Module Catalog Schema & Seed Data (M1 - M3)
-- Run this in your Supabase SQL Editor or via migration runner.

-- 1. Create modules catalog table
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'active',
  version TEXT NOT NULL DEFAULT '1.0',
  duration_weeks INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexing for module lookup
CREATE INDEX IF NOT EXISTS idx_modules_slug ON modules(slug);
CREATE INDEX IF NOT EXISTS idx_modules_status ON modules(status);

-- 2. Create module_taxonomy_mapping table
CREATE TABLE IF NOT EXISTS module_taxonomy_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  taxonomy_concern_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_module_taxonomy UNIQUE (module_id, taxonomy_concern_id)
);

-- Indexing for taxonomy concern lookup
CREATE INDEX IF NOT EXISTS idx_module_taxonomy_module_id ON module_taxonomy_mapping(module_id);
CREATE INDEX IF NOT EXISTS idx_module_taxonomy_concern_id ON module_taxonomy_mapping(taxonomy_concern_id);

-- 3. Insert or Update Catalog Seed Data for Modules M1, M2, and M3
INSERT INTO modules (id, slug, name, description, price, currency, status, version, duration_weeks)
VALUES
  (
    'M1',
    'self-worth-self-talk',
    'Self-Worth & Self-Talk',
    'A structured psychoeducation program addressing core self-criticism, guilt, and confidence patterns through evidence-based cognitive and somatic techniques.',
    349.00,
    'INR',
    'active',
    '1.0',
    7
  ),
  (
    'M2',
    'perfectionism-avoidance',
    'Perfectionism & Avoidance',
    'A clinical framework targeting rigid high standards, task avoidance, and performance anxiety using ACT and exposure-based micro-practices.',
    349.00,
    'INR',
    'active',
    '1.0',
    5
  ),
  (
    'M3',
    'anxiety-worry',
    'Anxiety & Worry',
    'A comprehensive psychoeducation system addressing chronic rumination, panic, intrusive thoughts, and physiological hyperarousal.',
    499.00,
    'INR',
    'active',
    '1.0',
    9
  )
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  status = EXCLUDED.status,
  version = EXCLUDED.version,
  duration_weeks = EXCLUDED.duration_weeks,
  updated_at = now();

-- 4. Insert or Update Taxonomy Concern Mappings
INSERT INTO module_taxonomy_mapping (module_id, taxonomy_concern_id)
VALUES
  ('M1', 'M1-C01'),
  ('M1', 'M1-C02'),
  ('M1', 'M1-C03'),
  ('M2', 'M2-C01'),
  ('M2', 'M2-C02'),
  ('M3', 'M3-C01'),
  ('M3', 'M3-C02'),
  ('M3', 'M3-C03'),
  ('M3', 'M3-C04')
ON CONFLICT (module_id, taxonomy_concern_id) DO NOTHING;
