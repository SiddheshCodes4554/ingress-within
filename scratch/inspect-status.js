// scratch/inspect-status.js
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
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
      if (key && val) {
        process.env[key] = val;
      }
    }
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7'; // Siddhesh ID

async function run() {
  console.log('=== DATABASE STATUS CHECK ===');
  
  // 1. Check user intelligence versions
  const { data: versions, error: vErr } = await supabase
    .from('user_intelligence_versions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  console.log('User Intelligence Versions:', vErr ? vErr.message : versions);

  // 2. Check weekly summaries
  const { data: summaries, error: sErr } = await supabase
    .from('weekly_summaries')
    .select('id, week_number, status, created_at, updated_at')
    .eq('user_id', userId);
  console.log('Weekly Summaries:', sErr ? sErr.message : summaries);

  // 3. Check entries vocab status
  const { data: entries, error: eErr } = await supabase
    .from('entries')
    .select('id, vocab_processed, content')
    .eq('user_id', userId);
  if (eErr) {
    console.error('Entries Fetch Error:', eErr.message);
  } else {
    console.log(`Total Entries: ${entries.length}`);
    console.log(`Unprocessed Vocab Entries: ${entries.filter(e => !e.vocab_processed).length}`);
  }

  // 4. Check thread responses vocab status
  const { data: responses, error: rErr } = await supabase
    .from('thread_responses')
    .select('id, vocab_processed')
    .eq('user_id', userId);
  if (rErr) {
    console.error('Thread Responses Fetch Error:', rErr.message);
  } else {
    console.log(`Total Thread Responses: ${responses.length}`);
    console.log(`Unprocessed Vocab Thread Responses: ${responses.filter(r => !r.vocab_processed).length}`);
  }
}

run();
