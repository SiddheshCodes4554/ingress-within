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

  console.log('Searching all tables for "snapshot" or "shift"...');
  
  const tables = [
    'weekly_summaries',
    'monthly_reports',
    'onboarding_assessments',
    'entries',
    'threads',
    'profiles'
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(100);

    if (error) {
      console.error(`Error querying table ${table}:`, error.message);
      continue;
    }

    for (const row of data || []) {
      const str = JSON.stringify(row).toLowerCase();
      if (str.includes('snapshot') || str.includes('shift')) {
        console.log(`Found match in table: ${table}, row ID: ${row.id || 'N/A'}`);
        // Print keys containing the match
        for (const [k, v] of Object.entries(row)) {
          if (JSON.stringify(v).toLowerCase().includes('snapshot') || JSON.stringify(v).toLowerCase().includes('shift')) {
            console.log(`  Key: ${k}, Value:`, v);
          }
        }
      }
    }
  }
}

run().catch(console.error);
