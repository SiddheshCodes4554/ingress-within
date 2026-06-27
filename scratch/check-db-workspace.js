import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually from current working directory
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
    console.log('[Env Loader] Environment variables loaded successfully.');
  }
} catch (err) {
  console.warn('[Env Loader] Could not load .env file:', err.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  console.log('Checking Supabase connection...');
  console.log('URL:', supabaseUrl);

  const { data: threadsData, error: threadsError } = await supabase
    .from('threads')
    .select('*')
    .limit(1);

  if (threadsError) {
    console.error('Error fetching threads:', threadsError);
  } else {
    console.log('Successfully connected to threads table. Sample data:', threadsData);
  }

  const { data: openThreadsData, error: openThreadsError } = await supabase
    .from('open_threads')
    .select('*')
    .limit(1);

  if (openThreadsError) {
    console.error('Error fetching open_threads:', openThreadsError);
  } else {
    console.log('Successfully connected to open_threads table. Sample data:', openThreadsData);
  }

  const { data: responsesData, error: responsesError } = await supabase
    .from('thread_responses')
    .select('*')
    .limit(1);

  if (responsesError) {
    console.error('Error fetching thread_responses:', responsesError);
  } else {
    console.log('Successfully connected to thread_responses table. Sample data:', responsesData);
  }
}

check();
