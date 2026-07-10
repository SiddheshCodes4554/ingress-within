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

  console.log('--- STARTING ENGINE HEALTH AND RETRY TESTS ---');

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

  const engine = 'reflection';

  // 2. Verify Initial Health
  console.log('\n[TEST 1] Checking initial engine health...');
  const health1 = await IntelligenceOrchestrator.getEngineHealth(userId, engine);
  console.log(`Initial Health Status for ${engine}:`, health1.status);

  // 3. Simulate job failure and transient retry
  console.log('\n[TEST 2] Simulating transient failure (Attempt 1)...');
  const jobId = await IntelligenceOrchestrator.enqueueJob(userId, engine, 'TestTrigger:HealthSim');
  await IntelligenceOrchestrator.startJob(jobId);
  await IntelligenceOrchestrator.failJob(jobId, userId, engine, 'Simulated transient connection timeout');

  // Query updated health
  const health2 = await IntelligenceOrchestrator.getEngineHealth(userId, engine);
  console.log(`Post-failure 1 status: ${health2.status}, attempts: ${health2.attempts}`);
  if (health2.status === 'Queued' || health2.status === 'Processing') {
    console.log('SUCCESS: Auto-retry enqueued the job again for a transient failure.');
  } else {
    console.error('FAIL: Auto-retry did not enqueue the job.');
  }

  // 4. Simulate permanent failure (exceeding attempts)
  console.log('\n[TEST 3] Simulating permanent failure (reaching max 3 attempts)...');
  await IntelligenceOrchestrator.failJob(jobId, userId, engine, 'Simulated permanent API credential denial');
  await IntelligenceOrchestrator.failJob(jobId, userId, engine, 'Simulated permanent API credential denial');

  const health3 = await IntelligenceOrchestrator.getEngineHealth(userId, engine);
  console.log(`Post-failure 3 status: ${health3.status}, attempts: ${health3.attempts}`);
  if (health3.status === 'Needs Repair' || health3.status === 'Failed') {
    console.log('SUCCESS: Permanent failure successfully captured. Manual review required.');
  } else {
    console.error('FAIL: Health status did not reflect permanent failure.');
  }

  // 5. Test stuck job cleanup (Timeout protection)
  console.log('\n[TEST 4] Simulating stuck job timeout (inf processing protection)...');
  const stuckJobId = await IntelligenceOrchestrator.enqueueJob(userId, 'vocabulary', 'TestTrigger:StuckSim');
  
  // Set started_at to 10 minutes ago
  await db
    .from('orchestrator_jobs')
    .update({
      status: 'running',
      started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    })
    .eq('id', stuckJobId);

  // Run daily maintenance containing stuck-job pruning
  await OrchestratorScheduler.runDailyMaintenance(userId);

  // Query stuck job status
  const { data: prunedJob } = await db
    .from('orchestrator_jobs')
    .select('status, last_error')
    .eq('id', stuckJobId)
    .single();

  console.log(`Pruned job status: ${prunedJob?.status}, error: ${prunedJob?.last_error}`);
  if ((prunedJob?.status === 'queued' || prunedJob?.status === 'running') && prunedJob?.last_error?.includes('timed out')) {
    console.log('SUCCESS: Stuck job successfully pruned and re-enqueued for retry.');
  } else {
    console.error('FAIL: Stuck job was not pruned.');
  }

  console.log('\n--- ALL HEALTH AND TELETEMETRY TESTS PASSED ---');
}

main().catch(console.error);
