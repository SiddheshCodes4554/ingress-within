import fs from 'fs';
import path from 'path';

// 1. Load .env file
try {
  const envContent = fs.readFileSync('D:/Internship/Ingress Within/.env', 'utf8');
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

async function runDiagnostics() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

  console.log('--- DIAGNOSING WEEKLY SUMMARIES ---');
  const { data: summaries } = await supabase
    .from('weekly_summaries')
    .select('id, user_id, cycle_id, week_number, day_start, day_end, status');
  console.log(summaries);

  console.log('--- DIAGNOSING ENTRIES ---');
  const { data: entries } = await supabase
    .from('entries')
    .select('id, user_id, cycle_id, cycle_day, created_at');
  console.log(entries);
}

runDiagnostics().catch(console.error);
