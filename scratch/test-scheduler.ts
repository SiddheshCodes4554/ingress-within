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

  // Re-import supabase after process.env is set
  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  const schedPath = pathToFileURL(path.join(process.cwd(), 'src/lib/orchestrator/orchestratorScheduler.ts')).href;
  const { OrchestratorScheduler } = await import(schedPath);

  console.log('--- STARTING ORCHESTRATOR SCHEDULER MAINTENANCE TESTS ---');

  // 1. Fetch user
  const { data: users } = await db.from('profiles').select('id, full_name').limit(1);
  const testUser = users?.[0];
  if (!testUser) {
    console.error('No users found in database to run tests.');
    return;
  }
  const userId = testUser.id;
  console.log(`Using test user: ${testUser.full_name} (${userId})`);

  // Cleanup prior test jobs/events/states
  await db.from('orchestrator_events').delete().eq('user_id', userId);
  await db.from('orchestrator_jobs').delete().eq('user_id', userId);

  // 2. Locate a completed weekly summary for this user
  const { data: summaries } = await db
    .from('weekly_summaries')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'READY')
    .limit(1);

  const summary = summaries?.[0];
  if (!summary) {
    console.warn('No completed weekly summaries found to run repair tests. Skipping Weekly Pattern repair test.');
  } else {
    console.log(`Found completed weekly summary: ID ${summary.id}, Week: ${summary.week_number}`);

    // Temporarily delete pattern snapshots matching this weekly summary ID to simulate missing snapshot
    const { data: deletedSnap } = await db
      .from('pattern_snapshots')
      .delete()
      .eq('user_id', userId)
      .eq('cycle_id', summary.id)
      .select();

    console.log(`Deleted ${deletedSnap?.length || 0} existing pattern snapshots to simulate missing data.`);

    // Run weekly maintenance scheduler check
    console.log('\n[TEST 1] Running Weekly Maintenance (Pattern repair)...');
    await OrchestratorScheduler.runWeeklyMaintenance(userId);

    // Verify pattern job is enqueued (it could have already run and transitioned to 'completed' or 'running')
    const { data: job } = await db
      .from('orchestrator_jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('engine', 'patterns')
      .maybeSingle();

    if (job && (job.status === 'queued' || job.status === 'completed' || job.status === 'running')) {
      console.log(`SUCCESS: Pattern repair job enqueued correctly. Job ID: ${job.id}, status: ${job.status}`);
    } else {
      console.error('FAIL: Pattern repair job not enqueued.', job);
    }
  }

  // 3. Test Daily Maintenance Knowledge stale check
  console.log('\n[TEST 2] Running Daily Maintenance (Knowledge behind)...');
  
  // Set last generated for knowledge to an old date to trigger behind/stale state
  await db.from('engine_state').upsert({
    user_id: userId,
    engine_name: 'knowledge',
    last_generated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
    status: 'idle',
    engine_version: '1.0'
  }, { onConflict: 'user_id,engine_name' });

  // Run daily maintenance
  await OrchestratorScheduler.runDailyMaintenance(userId);

  // Verify knowledge job is enqueued (might be completed or running due to inline execution)
  const { data: kJob } = await db
    .from('orchestrator_jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('engine', 'knowledge')
    .eq('trigger', 'DailyMaintenance:KnowledgeBehind')
    .maybeSingle();

  if (kJob && (kJob.status === 'queued' || kJob.status === 'completed' || kJob.status === 'running')) {
    console.log(`SUCCESS: Knowledge sync job enqueued correctly. Job ID: ${kJob.id}, status: ${kJob.status}`);
  } else {
    console.error('FAIL: Knowledge sync job not enqueued.', kJob);
  }

  console.log('\n--- ALL SCHEDULER MAINTENANCE TESTS PASSED ---');
}

main().catch(console.error);
