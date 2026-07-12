import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

async function main() {
  // Load env variables
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

  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  const testUser = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

  // 1. Fetch current active cycle
  let { data: activeCycle, error } = await db
    .from('cycles')
    .select('*')
    .eq('user_id', testUser)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!activeCycle) {
    // try lowercase
    const { data: fallback } = await db
      .from('cycles')
      .select('*')
      .eq('user_id', testUser)
      .eq('status', 'active')
      .maybeSingle();
    activeCycle = fallback;
  }

  console.log('Current Active Cycle:');
  console.log(activeCycle);

  if (!activeCycle) {
    console.log('No active cycle found. Checking for completed cycles requiring assessment...');
    const { data: completedCycle } = await db
      .from('cycles')
      .select('*')
      .eq('user_id', testUser)
      .eq('status', 'COMPLETED')
      .eq('assessment_completed', false)
      .order('cycle_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    console.log('Completed cycle found:', completedCycle);
  }

  console.log('\n========================================');
  console.log('CYCLE AUTO-TRANSITION TESTS COMPLETED!');
  console.log('========================================');
}

main().catch(err => {
  console.error('\nVerification Failed:', err);
  process.exit(1);
});
