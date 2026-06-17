import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
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
} catch (e: any) {
  console.error('Could not read .env file:', e.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase variables in .env!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const requiredTables = [
  'users',
  'auth_accounts',
  'cycles',
  'entries',
  'entry_scores',
  'reflections',
  'weekly_summaries',
  'open_threads',
  'exercise_templates',
  'exercises',
  'patterns',
  'pattern_cycle_states',
  'vocab_words',
  'vocab_clusters',
  'assessments',
  'monthly_scores',
  'ai_jobs'
];

async function verifyDatabase() {
  console.log('=== DATABASE SCHEMAS VERIFICATION ===\n');
  let missingTablesCount = 0;
  
  for (const table of requiredTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      // PGRST116 means empty table, which is fine (exists!). 
      // 42P01 means table does not exist.
      if (error.code === 'PGRST116') {
        console.log(`Table "${table}": ✅ EXISTS (Empty)`);
      } else if (error.message.includes('does not exist') || error.message.includes('Could not find')) {
        console.log(`Table "${table}": ❌ MISSING`);
        missingTablesCount++;
      } else {
        console.log(`Table "${table}": ⚠️ UNKNOWN STATUS (Error: ${error.message}, Code: ${error.code})`);
      }
    } else {
      console.log(`Table "${table}": ✅ EXISTS (Rows: ${data.length})`);
    }
  }

  console.log('\n======================================');
  if (missingTablesCount > 0) {
    console.log(`\n❌ VERIFICATION FAILED: ${missingTablesCount} tables are missing.`);
    console.log('Please copy the contents of "scratch/database-alignment.sql" and run them in your Supabase SQL Editor.');
    console.log('Once executed, run this verification script again to confirm database alignment.');
  } else {
    console.log('\n🎉 ALL TABLES VERIFIED! Database schema is fully aligned.');
  }
}

verifyDatabase();
