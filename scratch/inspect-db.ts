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

async function inspectDatabase() {
  console.log('=== CHECKPOINT 3: DATABASE AUDIT ===');
  
  // 1. Fetch users
  const { data: users, error: usersError } = await supabase.from('users').select('*');
  if (usersError) {
    console.error('Error fetching users:', usersError.message);
  } else {
    console.log(`\nUsers Count: ${users.length}`);
    console.log(JSON.stringify(users, null, 2));
  }

  // 2. Fetch profiles
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError.message);
  } else {
    console.log(`\nProfiles Count: ${profiles.length}`);
    console.log(JSON.stringify(profiles, null, 2));
  }

  // 3. Fetch sessions
  const { data: sessions, error: sessionsError } = await supabase.from('user_sessions').select('*');
  if (sessionsError) {
    console.error('Error fetching user sessions:', sessionsError.message);
  } else {
    console.log(`\nSessions Count: ${sessions.length}`);
    console.log(JSON.stringify(sessions.map(s => ({
      id: s.id,
      user_id: s.user_id,
      device_id: s.device_id,
      device_name: s.device_name,
      is_active: s.is_active,
      expires_at: s.expires_at
    })), null, 2));
  }

  // 4. Audit RLS policies & check triggers
  console.log('\n=== CHECKPOINT 4: RLS POLICIES & TRIGGERS ===');
  const { data: policyRows, error: policyError } = await supabase.rpc('inspect_policies');
  if (policyError) {
    // If custom inspect rpc is not available, run raw query for policies
    const { data: rawPolicies, error: rawError } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname, roles, cmd, qual, with_check');
    if (rawError) {
      console.log('Could not inspect pg_policies table directly. Requires admin DB query.');
    } else {
      console.log('Active policies in database:');
      console.log(JSON.stringify(rawPolicies.filter(p => p.schemaname === 'public'), null, 2));
    }
  } else {
    console.log(JSON.stringify(policyRows, null, 2));
  }
}

inspectDatabase();
