import fs from 'fs';
import path from 'path';

// Load .env variables
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

async function run() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Querying all weekly summaries...');
  const { data: summaries, error } = await supabase
    .from('weekly_summaries')
    .select('*');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${summaries?.length} summaries.`);
  for (const s of summaries || []) {
    console.log('==================================================');
    console.log(`ID: ${s.id}, Week: ${s.week_number}, Status: ${s.status}`);
    console.log(`Title: ${s.title}`);
    console.log(`Why: ${s.why}`);
    console.log(`Body:\n${s.body}`);
  }
}

run().catch(console.error);
