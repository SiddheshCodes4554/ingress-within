import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

async function main() {
  // Load env variables
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    });
  } catch (e) {
    console.error('Could not read .env file:', e.message);
  }

  // Re-import supabase after process.env is set
  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  const sql = `
    CREATE TABLE IF NOT EXISTS knowledge_backfill_status (
      user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      started_at TIMESTAMPTZ DEFAULT NULL,
      completed_at TIMESTAMPTZ DEFAULT NULL,
      current_step TEXT DEFAULT NULL,
      processed_events INTEGER DEFAULT 0,
      remaining_events INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
      error_message TEXT DEFAULT NULL,
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE knowledge_backfill_status ENABLE ROW LEVEL SECURITY;

    -- Create select policy
    DROP POLICY IF EXISTS "Allow authenticated read" ON knowledge_backfill_status;
    CREATE POLICY "Allow authenticated read" ON knowledge_backfill_status
      FOR SELECT USING (true);
  `;

  console.log('Running SQL migration to create knowledge_backfill_status...');
  const { data, error } = await db.rpc('exec_sql', { sql });
  if (error) {
    console.error('Migration failed:', error.message);
  } else {
    console.log('Migration succeeded!', data);
  }
}

main().catch(console.error);
