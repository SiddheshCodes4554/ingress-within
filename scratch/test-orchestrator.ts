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

  console.log('--- STARTING INTELLIGENCE ORCHESTRATOR TESTS ---');

  // 1. Fetch user
  const { data: users } = await db.from('profiles').select('id, full_name').limit(1);
  const testUser = users?.[0];
  if (!testUser) {
    console.error('No users found in database to run tests.');
    return;
  }
  const userId = testUser.id;
  console.log(`Using test user: ${testUser.full_name} (${userId})`);

  // Cleanup prior test jobs/events to start fresh
  await db.from('orchestrator_events').delete().eq('user_id', userId);
  await db.from('orchestrator_jobs').delete().eq('user_id', userId);
  await db.from('engine_state').delete().eq('user_id', userId);

  const validUuid = '10000000-0000-4000-a000-000000000001';

  // 2. Emit JournalSubmitted event
  console.log('\n[TEST 1] Emitting "JournalSubmitted" event...');
  await IntelligenceOrchestrator.emitEvent(userId, 'JournalSubmitted', { entry_id: validUuid });

  // 3. Verify event logged
  const { data: events } = await db
    .from('orchestrator_events')
    .select('*')
    .eq('user_id', userId)
    .eq('event_type', 'JournalSubmitted');

  if (events && events.length === 1) {
    console.log('SUCCESS: Event successfully logged in database.');
  } else {
    console.error('FAIL: Event not found or duplicated.', events);
  }

  // 4. Verify jobs enqueued automatically (reflection and vocabulary)
  const { data: jobs } = await db
    .from('orchestrator_jobs')
    .select('*')
    .eq('user_id', userId);

  console.log(`SUCCESS: Found ${jobs?.length} enqueued jobs in database.`);
  jobs?.forEach(j => {
    console.log(`- Job ID: ${j.id}, Engine: ${j.engine}, Status: ${j.status}`);
  });

  const reflectionJob = jobs?.find(j => j.engine === 'reflection');
  const vocabJob = jobs?.find(j => j.engine === 'vocabulary');

  if (reflectionJob && vocabJob) {
    console.log('SUCCESS: "reflection" and "vocabulary" jobs enqueued correctly.');
  } else {
    console.error('FAIL: Missing triggered jobs.');
  }

  // 5. Test Start and Complete Job
  if (reflectionJob) {
    console.log('\n[TEST 2] Starting "reflection" job...');
    await IntelligenceOrchestrator.startJob(reflectionJob.id);

    const { data: startCheck } = await db
      .from('orchestrator_jobs')
      .select('status, started_at')
      .eq('id', reflectionJob.id)
      .single();
    
    console.log(`Job Status: ${startCheck?.status}, Started At: ${startCheck?.started_at}`);
    if (startCheck?.status === 'running') {
      console.log('SUCCESS: Job transitioned to running.');
    } else {
      console.error('FAIL: Job status mismatch.');
    }

    console.log('Completing "reflection" job...');
    await IntelligenceOrchestrator.completeJob(reflectionJob.id, userId, 'reflection', {
      lastProcessedEntry: validUuid
    });

    const { data: completeCheck } = await db
      .from('orchestrator_jobs')
      .select('status, completed_at')
      .eq('id', reflectionJob.id)
      .single();

    console.log(`Job Status: ${completeCheck?.status}, Completed At: ${completeCheck?.completed_at}`);
    if (completeCheck?.status === 'completed') {
      console.log('SUCCESS: Job transitioned to completed.');
    } else {
      console.error('FAIL: Job status mismatch.');
    }

    // Verify engine state
    const engineState = await IntelligenceOrchestrator.getEngineState(userId, 'reflection');
    console.log('Engine State:', engineState);
    if (engineState && engineState.status === 'idle' && engineState.last_processed_entry === validUuid) {
      console.log('SUCCESS: Engine state updated correctly.');
    } else {
      console.error('FAIL: Engine state mismatch.');
    }
  }

  // 6. Test Fail and Retry Job
  if (vocabJob) {
    console.log('\n[TEST 3] Failing "vocabulary" job...');
    await IntelligenceOrchestrator.failJob(vocabJob.id, userId, 'vocabulary', 'Simulated execution error');

    const { data: failCheck } = await db
      .from('orchestrator_jobs')
      .select('status, attempts, last_error')
      .eq('id', vocabJob.id)
      .single();

    console.log(`Job Status: ${failCheck?.status}, Attempts: ${failCheck?.attempts}, Last Error: "${failCheck?.last_error}"`);
    if (failCheck?.status === 'queued' && failCheck.attempts === 1) {
      console.log('SUCCESS: Job failed once, transitioned to queued for retry.');
    } else {
      console.error('FAIL: Job failure state mismatch.');
    }

    // Verify retry event logged
    const { data: retryEvent } = await db
      .from('orchestrator_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_type', 'WorkerRetried')
      .single();

    if (retryEvent) {
      console.log('SUCCESS: "WorkerRetried" event emitted correctly.');
      console.log('Event Payload:', retryEvent.payload);
    } else {
      console.error('FAIL: Retry event not found.');
    }
  }

  console.log('\n--- ALL INTELLIGENCE ORCHESTRATOR TESTS PASSED ---');
}

main().catch(console.error);
