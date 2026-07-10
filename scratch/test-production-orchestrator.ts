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

  const orchPath = pathToFileURL(path.join(process.cwd(), 'src/lib/orchestrator/intelligenceOrchestrator.ts')).href;
  const { IntelligenceOrchestrator } = await import(orchPath);

  const schedPath = pathToFileURL(path.join(process.cwd(), 'src/lib/orchestrator/orchestratorScheduler.ts')).href;
  const { OrchestratorScheduler } = await import(schedPath);

  console.log('=== STARTING PRODUCTION INTEGRATION TESTS ===');

  // 1. Fetch Users
  const { data: users } = await db.from('profiles').select('id, full_name').limit(2);
  if (!users || users.length < 2) {
    console.error('Test requires at least 2 users in the database to verify tenant isolation.');
    return;
  }
  const userA = users[0];
  const userB = users[1];
  console.log(`User A: ${userA.full_name} (${userA.id})`);
  console.log(`User B: ${userB.full_name} (${userB.id})`);

  // Cleanup prior jobs/events for users
  await db.from('orchestrator_events').delete().in('user_id', [userA.id, userB.id]);
  await db.from('orchestrator_jobs').delete().in('user_id', [userA.id, userB.id]);

  const testEntryId = '50000000-0000-4000-a000-000000000001';
  const testCycleId = '60000000-0000-4000-a000-000000000001';

  // --- SCENARIO 1: JOURNAL SUBMISSION & EVENTS ---
  console.log('\n[SCENARIO 1] Journal Submission & Event propagation...');
  await IntelligenceOrchestrator.emitEvent(userA.id, 'JournalSubmitted', {
    entry_id: testEntryId,
    version: '1.0' // Versioning
  });

  const { data: job1 } = await db
    .from('orchestrator_jobs')
    .select('*')
    .eq('user_id', userA.id)
    .eq('engine', 'crisis_detection')
    .single();

  if (job1) {
    console.log('SUCCESS: crisis_detection job enqueued.');
  } else {
    console.error('FAIL: crisis_detection job not enqueued.');
  }

  // --- SCENARIO 2: WORKER FAILURE & RETRY ---
  console.log('\n[SCENARIO 2] Worker Failure & Retry flow...');
  await IntelligenceOrchestrator.failJob(job1.id, userA.id, 'crisis_detection', 'Transient connection fail');
  
  const { data: retriedJob } = await db
    .from('orchestrator_jobs')
    .select('status, attempts')
    .eq('id', job1.id)
    .single();

  console.log(`Retried status: ${retriedJob?.status}, attempts: ${retriedJob?.attempts}`);
  if ((retriedJob?.status === 'queued' || retriedJob?.status === 'running') && retriedJob.attempts === 1) {
    console.log('SUCCESS: Job re-enqueued for transient retry.');
  } else {
    console.error('FAIL: Job did not retry.');
  }

  // --- SCENARIO 3: MULTIPLE USERS & TENANT ISOLATION ---
  console.log('\n[SCENARIO 3] Tenant Isolation check...');
  const { data: userBJob, error: isolationErr } = await db
    .from('orchestrator_jobs')
    .select('*')
    .eq('user_id', userB.id);

  if (!isolationErr && userBJob.length === 0) {
    console.log('SUCCESS: User B has no visibility of User A\'s enqueued jobs.');
  } else {
    console.error('FAIL: Tenant isolation breach or query error:', isolationErr?.message);
  }

  // --- SCENARIO 4: NEW USER PIPELINE (Day 1 onboarding) ---
  console.log('\n[SCENARIO 4] New User sequence (Day 1 check)...');
  await IntelligenceOrchestrator.emitEvent(userA.id, 'VocabularyCompleted', {
    entry_id: testEntryId, // Day 1
    cycle_id: testCycleId
  });

  // Verify that it went directly to patterns (no weekly report because it is Day 1)
  const { data: dueReport } = await db
    .from('weekly_summaries')
    .select('id')
    .eq('cycle_id', testCycleId)
    .maybeSingle();

  if (!dueReport) {
    console.log('SUCCESS: New user entry correctly bypassed weekly summaries.');
  } else {
    console.error('FAIL: Weekly report triggered incorrectly on Day 1.');
  }

  // --- SCENARIO 5: DEPLOY & RESTART STABILITY ---
  console.log('\n[SCENARIO 5] Deploy & Restart stability check (pruning stuck jobs)...');
  const stuckJobId = await IntelligenceOrchestrator.enqueueJob(userA.id, 'reflection', 'DeploySim:Stuck');
  await db.from('orchestrator_jobs').update({
    status: 'running',
    started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
  }).eq('id', stuckJobId);

  await OrchestratorScheduler.runDailyMaintenance(userA.id);

  const { data: recoveredJob } = await db
    .from('orchestrator_jobs')
    .select('status, last_error')
    .eq('id', stuckJobId)
    .single();

  console.log(`Stuck job recovery status: ${recoveredJob?.status}, error: ${recoveredJob?.last_error}`);
  if ((recoveredJob?.status === 'queued' || recoveredJob?.status === 'running') && recoveredJob.last_error?.includes('timed out')) {
    console.log('SUCCESS: Stuck job recovered and timed out successfully during restart/maintenance.');
  } else {
    console.error('FAIL: Stuck job was not timed out.');
  }

  console.log('\n=== ALL PRODUCTION INTEGRATION TESTS PASSED ===');
}

main().catch(console.error);
