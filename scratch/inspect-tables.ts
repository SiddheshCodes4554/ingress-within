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

async function inspectTables() {
  console.log('Querying database tables in public schema...');
  const { data, error } = await supabase.rpc('get_tables');
  
  if (error) {
    console.log('get_tables RPC not available, querying pg_catalog via raw SQL or checking pg_tables...');
    // We can run a select on pg_tables if we have a way, otherwise we can try querying common tables.
    const tables = ['users', 'profiles', 'user_sessions', 'consents', 'otp_verifications', 'daily_sessions', 'journal_entries', 'exercises'];
    for (const t of tables) {
      const { error: tError } = await supabase.from(t).select('*').limit(1);
      if (tError) {
        console.log(`Table "${t}": ❌ does not exist or error (${tError.message})`);
      } else {
        console.log(`Table "${t}": ✅ exists`);
      }
    }
  } else {
    console.log('Tables found:', JSON.stringify(data, null, 2));
  }
}

inspectTables();
