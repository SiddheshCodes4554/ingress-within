import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env
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
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDebug() {
  const { data: users } = await supabase.from('users').select('id').limit(1);
  if (!users || users.length === 0) {
    console.error('No users found in db');
    return;
  }
  const userId = users[0].id;
  console.log('Testing with userId:', userId);

  console.log('\n--- Query 1: Join with daily_sessions!fk_daily_sessions_entry ---');
  const res1 = await supabase
    .from('entries')
    .select('*, reflections(*), daily_sessions!fk_daily_sessions_entry(day_number), cycles(cycle_number, number)')
    .eq('user_id', userId)
    .limit(5);
  
  if (res1.error) {
    console.error('Query 1 Failed:', res1.error.message, res1.error.code);
  } else {
    console.log('Query 1 Succeeded! Row count:', res1.data?.length);
  }

  console.log('\n--- Query 2 (Fallback): Simple Join with cycles ---');
  const res2 = await supabase
    .from('entries')
    .select('*, reflections(*), cycles(cycle_number, number)')
    .eq('user_id', userId)
    .limit(5);

  if (res2.error) {
    console.error('Query 2 Failed:', res2.error.message, res2.error.code);
  } else {
    console.log('Query 2 Succeeded! Row count:', res2.data?.length);
  }

  console.log('\n--- Query 3: Basic select from entries ---');
  const res3 = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .limit(5);

  if (res3.error) {
    console.error('Query 3 Failed:', res3.error.message, res3.error.code);
  } else {
    console.log('Query 3 Succeeded! Row count:', res3.data?.length);
  }
}

runDebug();
