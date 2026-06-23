import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env
try {
  const envContent = fs.readFileSync(path.resolve('d:/Internship/Ingress Within/.env'), 'utf8');
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
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data: users } = await supabase.from('users').select('id').limit(1);
  const userId = users?.[0]?.id;
  if (!userId) return;

  console.log('Testing select("*, reflections(*), daily_sessions!fk_daily_sessions_entry(day_number)")');
  const { data: entries1, error: error1 } = await supabase
    .from('entries')
    .select('*, reflections(*), daily_sessions!fk_daily_sessions_entry(day_number)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error1) {
    console.error('Query 1 failed:', error1);
  } else {
    console.log('Query 1 succeeded! Reflections count in first entry:', entries1?.[0]?.reflections?.length);
    console.log('Reflections data in first entry:', entries1?.[0]?.reflections);
  }

  console.log('\nTesting select("*, reflections(*), daily_sessions!journal_entries_session_id_fkey(day_number)")');
  const { data: entries2, error: error2 } = await supabase
    .from('entries')
    .select('*, reflections(*), daily_sessions!journal_entries_session_id_fkey(day_number)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error2) {
    console.error('Query 2 failed:', error2);
  } else {
    console.log('Query 2 succeeded! Reflections count in first entry:', entries2?.[0]?.reflections?.length);
    console.log('Reflections data in first entry:', entries2?.[0]?.reflections);
  }

  console.log('\nTesting fallback select("*, reflections(*)")');
  const { data: entries3, error: error3 } = await supabase
    .from('entries')
    .select('*, reflections(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error3) {
    console.error('Fallback query failed:', error3);
  } else {
    console.log('Fallback query succeeded! Reflections count in first entry:', entries3?.[0]?.reflections?.length);
  }
}

run();
