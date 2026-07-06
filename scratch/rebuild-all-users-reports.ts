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

process.env.BYPASS_REDIS = 'true';

async function runRebuild() {
  console.log('=== REBUILD ALL WEEKLY REPORTS FOR ALL USERS ===\n');

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

  const { processWeeklySummary } = await import('../src/lib/queue/workers/weeklySummaryWorker');

  // Fetch all existing weekly summaries
  const { data: summaries, error: fetchErr } = await supabase
    .from('weekly_summaries')
    .select('*')
    .order('created_at', { ascending: true });

  if (fetchErr) {
    throw new Error(`Failed to fetch summaries: ${fetchErr.message}`);
  }

  if (!summaries || summaries.length === 0) {
    console.log('No weekly summaries found to rebuild.');
    return;
  }

  console.log(`Found ${summaries.length} weekly summaries. Rebuilding them one by one...\n`);

  let succeeded = 0;
  let failed = 0;

  for (const summary of summaries) {
    console.log(`--------------------------------------------------`);
    console.log(`Rebuilding summary ID: ${summary.id}`);
    console.log(`User ID:               ${summary.user_id}`);
    console.log(`Cycle ID:              ${summary.cycle_id}`);
    console.log(`Week Number:           ${summary.week_number}`);

    try {
      // 1. Reset the status in the database to PENDING to bypass immutability guard
      await supabase
        .from('weekly_summaries')
        .update({
          status: 'PENDING',
          title: null,
          why: null,
          body: null,
          open_question: null,
          generated_at: null
        })
        .eq('id', summary.id);

      // 2. Process weekly summary using the worker
      await processWeeklySummary({
        cycle_id: summary.cycle_id,
        user_id: summary.user_id,
        week_number: summary.week_number,
        summary_id: summary.id
      });

      console.log(`SUCCESS: Rebuilt summary ID ${summary.id}`);
      succeeded++;
    } catch (err: any) {
      console.error(`ERROR rebuilding summary ID ${summary.id}:`, err.message || err);
      failed++;
    }
  }

  console.log(`\n==================================================`);
  console.log(`Rebuild execution finished.`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed:    ${failed}`);
  console.log(`==================================================`);
}

runRebuild().catch(console.error);
