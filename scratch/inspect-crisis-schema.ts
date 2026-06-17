import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

async function inspectCrisis() {
  console.log('Checking entries schema...');
  const { data: entryData, error: entryError } = await supabase.from('entries').select('*').limit(1);
  if (entryError) {
    console.error('Error selecting from entries:', entryError.message);
  } else {
    console.log('Entries columns:', entryData.length > 0 ? Object.keys(entryData[0]) : 'Empty table but select worked');
  }

  console.log('\nChecking users schema...');
  const { data: userData, error: userError } = await supabase.from('users').select('*').limit(1);
  if (userError) {
    console.error('Error selecting from users:', userError.message);
  } else {
    console.log('Users columns:', userData.length > 0 ? Object.keys(userData[0]) : 'Empty table but select worked');
  }

  console.log('\nChecking crisis_log table...');
  const { data: logData, error: logError } = await supabase.from('crisis_log').select('*').limit(1);
  if (logError) {
    console.log('crisis_log table does NOT exist or error:', logError.message);
  } else {
    console.log('crisis_log table exists! Columns:', logData.length > 0 ? Object.keys(logData[0]) : 'Empty table but select worked');
  }
}

inspectCrisis();
