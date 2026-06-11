import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Parse .env manually from current working directory
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      // Remove surrounding quotes if any
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

console.log('Diagnostic Test: Supabase Connection');
console.log('URL:', supabaseUrl);
console.log('Service Role Key (first 15 chars):', supabaseServiceKey.substring(0, 15) + '...');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase environment variables are missing in .env!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('\nQuerying public.users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('❌ users table check failed:', usersError.message, usersError.code);
    } else {
      console.log('✅ users table exists and is accessible. Rows found:', users.length);
    }

    console.log('\nQuerying public.otp_verifications table...');
    const { data: otps, error: otpsError } = await supabase
      .from('otp_verifications')
      .select('*')
      .limit(1);

    if (otpsError) {
      console.error('❌ otp_verifications table check failed:', otpsError.message, otpsError.code);
    } else {
      console.log('✅ otp_verifications table exists and is accessible. Rows found:', otps.length);
    }

    console.log('\nQuerying public.user_sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .limit(1);

    if (sessionsError) {
      console.error('❌ user_sessions table check failed:', sessionsError.message, sessionsError.code);
    } else {
      console.log('✅ user_sessions table exists and is accessible. Rows found:', sessions.length);
    }

  } catch (err: any) {
    console.error('Fatal error during diagnostic test:', err.message);
  }
}

testConnection();
