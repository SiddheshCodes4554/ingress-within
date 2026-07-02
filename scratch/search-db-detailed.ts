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

  console.log('Fetching all rows from weekly_summaries...');
  
  const { data, error } = await supabase
    .from('weekly_summaries')
    .select('*');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log(`Found ${data?.length} rows.`);

  for (const row of data || []) {
    console.log(`\nRow ID: ${row.id}, status: ${row.status}, Title: "${row.title}"`);
    console.log(`Why: "${row.why}"`);
    console.log(`Body (first 100 chars): "${row.body?.substring(0, 100)}..."`);
    if (row.body && (row.body.toLowerCase().includes('snapshot') || row.body.toLowerCase().includes('shift') || row.body.toLowerCase().includes('pattern'))) {
      console.log('--> MATCH in body!');
      console.log(row.body);
    }
    if (row.why && (row.why.toLowerCase().includes('snapshot') || row.why.toLowerCase().includes('shift') || row.why.toLowerCase().includes('pattern'))) {
      console.log('--> MATCH in why!');
      console.log(row.why);
    }
    const reportDataStr = JSON.stringify(row.report_data || {});
    if (reportDataStr.toLowerCase().includes('snapshot') || reportDataStr.toLowerCase().includes('shift')) {
      console.log('--> MATCH in report_data!');
      console.log(JSON.stringify(row.report_data, null, 2));
    }
  }
}

run().catch(console.error);
