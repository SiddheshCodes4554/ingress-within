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

const candidateTables = [
  'ai_jobs', 'jobs', 'tasks', 'events', 
  'entry_scores', 'reflections', 'cycles', 'entries', 
  'weekly_summaries', 'open_threads', 'patterns', 
  'pattern_cycle_states', 'vocab_words', 'vocab_clusters', 
  'exercises', 'exercise_templates', 'assessments', 'monthly_scores'
];

async function checkTables() {
  console.log('Checking existence of spec tables in active Supabase...');
  for (const table of candidateTables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      // Code PGRST116 or 42P01 means table does not exist
      if (error.code === 'PGRST116' || error.message.includes('does not exist') || error.message.includes('Could not find')) {
        console.log(`Table "${table}": ❌ Does not exist`);
      } else {
        console.log(`Table "${table}": ⚠️ Exists but returned error: ${error.message} (Code: ${error.code})`);
      }
    } else {
      console.log(`Table "${table}": ✅ EXISTS`);
    }
  }
}

checkTables();
