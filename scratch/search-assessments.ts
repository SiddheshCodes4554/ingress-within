import fs from 'fs';
import path from 'path';

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

  console.log('Fetching all rows from assessments...');
  
  const { data, error } = await supabase
    .from('assessments')
    .select('*');

  if (error) {
    console.error('Error querying assessments:', error.message);
    return;
  }

  console.log(`Found ${data?.length} rows in assessments.`);

  for (const row of data || []) {
    console.log(`\nRow ID: ${row.id}, path: ${row.path_assignment}, branch: ${row.branch_assignment}`);
    console.log(`Report Text (first 300 chars): "${row.report_text?.substring(0, 300)}..."`);
    if (row.report_text && (row.report_text.toLowerCase().includes('snapshot') || row.report_text.toLowerCase().includes('shift') || row.report_text.toLowerCase().includes('pattern'))) {
      console.log('--> MATCH in report_text!');
      console.log(row.report_text);
    }
    const reportDataStr = JSON.stringify(row.report_data || {});
    if (reportDataStr.toLowerCase().includes('snapshot') || reportDataStr.toLowerCase().includes('shift')) {
      console.log('--> MATCH in report_data!');
      console.log(JSON.stringify(row.report_data, null, 2));
    }
  }
}

run().catch(console.error);
