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

async function runJsMigration() {
  console.log('Fetching active sessions...');
  const { data: sessions, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('is_active', true)
    .order('expires_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error.message);
    return;
  }

  console.log(`Found ${sessions.length} active sessions.`);
  
  // Track seen combinations of user_id + device_id
  const seen = new Set<string>();
  const toDeactivate: string[] = [];

  for (const session of sessions) {
    const key = `${session.user_id}:${session.device_id}`;
    if (seen.has(key)) {
      toDeactivate.push(session.id);
    } else {
      seen.add(key);
    }
  }

  if (toDeactivate.length === 0) {
    console.log('No duplicate active sessions found.');
    return;
  }

  console.log(`Deactivating ${toDeactivate.length} duplicate active sessions...`);
  console.log('IDs:', toDeactivate);

  const { error: updateError } = await supabase
    .from('user_sessions')
    .update({ is_active: false })
    .in('id', toDeactivate);

  if (updateError) {
    console.error('Error updating sessions:', updateError.message);
  } else {
    console.log('✅ JS session cleanup migration completed successfully.');
  }
}

runJsMigration();
