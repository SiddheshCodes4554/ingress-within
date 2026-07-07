-- Migration to create pattern_backfill_status table
CREATE TABLE IF NOT EXISTS pattern_backfill_status (
  user_id                    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status                     TEXT        NOT NULL CHECK (status IN ('NOT_STARTED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')),
  progress_total_cycles      INTEGER     NOT NULL DEFAULT 0,
  progress_processed_cycles  INTEGER     NOT NULL DEFAULT 0,
  progress_total_entries     INTEGER     NOT NULL DEFAULT 0,
  progress_processed_entries INTEGER     NOT NULL DEFAULT 0,
  snapshot_created           BOOLEAN     NOT NULL DEFAULT FALSE,
  error_message              TEXT,
  queued_at                  TIMESTAMPTZ,
  started_at                 TIMESTAMPTZ,
  completed_at               TIMESTAMPTZ,
  failed_at                  TIMESTAMPTZ,
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE pattern_backfill_status ENABLE ROW LEVEL SECURITY;

-- Check if policy already exists before creating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pattern_backfill_status' 
      AND policyname = 'Users can read own pattern backfill status'
  ) THEN
    CREATE POLICY "Users can read own pattern backfill status"
      ON pattern_backfill_status FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

GRANT ALL ON pattern_backfill_status TO service_role;
GRANT ALL ON pattern_backfill_status TO authenticated;
