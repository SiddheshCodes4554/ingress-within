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

async function inspectDailySessions() {
  const { data: dailySessions, error } = await supabase.from('daily_sessions').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching daily sessions:', error);
  } else {
    console.log(`Daily Sessions Count: ${dailySessions.length}`);
    console.log(JSON.stringify(dailySessions.map(s => ({
      id: s.id,
      user_id: s.user_id,
      day_number: s.day_number,
      status: s.status,
      created_at: s.created_at,
      completed_at: s.completed_at
    })), null, 2));
  }
}

inspectDailySessions();
