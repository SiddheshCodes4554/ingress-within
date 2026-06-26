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
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCyclesSchema() {
  console.log('Fetching a single row from cycles...');
  const { data, error } = await supabase.from('cycles').select('*').limit(1);
  if (error) {
    console.error('Error fetching cycles:', error);
  } else {
    console.log('Successful fetch! Row keys/columns:', data.length > 0 ? Object.keys(data[0]) : 'No rows present in table cycles.');
    if (data.length > 0) {
      console.log('Sample Row data:', JSON.stringify(data[0], null, 2));
    }
  }
}

checkCyclesSchema();
