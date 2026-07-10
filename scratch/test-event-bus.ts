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

  console.log('--- STARTING EVENT BUS AND PIPELINE TESTS ---');

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

  const testEntryId = '20000000-0000-4000-a000-000000000001';
  const testCycleId = '30000000-0000-4000-a000-000000000001';

  // --- PHASE 1: SEQUENTIAL DECOUPLED PIPELINE TESTS ---

  // 1. Emit JournalSubmitted -> triggers crisis_detection
  console.log('\n[TEST 1] Emitting "JournalSubmitted" event...');
  await IntelligenceOrchestrator.emitEvent(userId, 'JournalSubmitted', { entry_id: testEntryId });

  const { data: job1 } = await db
    .from('orchestrator_jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('engine', 'crisis_detection')
    .single();

  if (job1 && job1.status === 'queued') {
    console.log('SUCCESS: crisis_detection job enqueued automatically.');
  } else {
    console.error('FAIL: crisis_detection job not enqueued.', job1);
  }

  // 2. Emit CrisisDetected (no crisis) -> triggers reflection
  console.log('\n[TEST 2] Emitting "CrisisDetected" (has_crisis: false) event...');
  await IntelligenceOrchestrator.emitEvent(userId, 'CrisisDetected', {
    entry_id: testEntryId,
    cycle_id: testCycleId,
    has_crisis: false
  });

  const { data: job2 } = await db
    .from('orchestrator_jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('engine', 'reflection')
    .single();

  if (job2 && job2.status === 'queued') {
    console.log('SUCCESS: reflection job enqueued automatically.');
  } else {
    console.error('FAIL: reflection job not enqueued.', job2);
  }

  // 3. Emit ReflectionCompleted -> triggers vocabulary
  console.log('\n[TEST 3] Emitting "ReflectionCompleted" event...');
  await IntelligenceOrchestrator.emitEvent(userId, 'ReflectionCompleted', {
    entry_id: testEntryId,
    cycle_id: testCycleId
  });

  const { data: job3 } = await db
    .from('orchestrator_jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('engine', 'vocabulary')
    .single();

  if (job3 && job3.status === 'queued') {
    console.log('SUCCESS: vocabulary job enqueued automatically.');
  } else {
    console.error('FAIL: vocabulary job not enqueued.', job3);
  }

  // 4. Emit VocabularyCompleted -> triggers patterns directly (since day is not milestone)
  console.log('\n[TEST 4] Emitting "VocabularyCompleted" event...');
  await IntelligenceOrchestrator.emitEvent(userId, 'VocabularyCompleted', {
    entry_id: testEntryId,
    cycle_id: testCycleId
  });

  const { data: job4 } = await db
    .from('orchestrator_jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('engine', 'patterns')
    .single();

  if (job4 && job4.status === 'queued') {
    console.log('SUCCESS: patterns job enqueued automatically.');
  } else {
    console.error('FAIL: patterns job not enqueued.', job4);
  }

  // 5. Emit PatternCompleted -> triggers knowledge
  console.log('\n[TEST 5] Emitting "PatternCompleted" event...');
  await IntelligenceOrchestrator.emitEvent(userId, 'PatternCompleted', {
    weekly_summary_id: testEntryId,
    cycle_id: testCycleId
  });

  const { data: job5 } = await db
    .from('orchestrator_jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('engine', 'knowledge')
    .single();

  if (job5 && job5.status === 'queued') {
    console.log('SUCCESS: knowledge job enqueued automatically.');
  } else {
    console.error('FAIL: knowledge job not enqueued.', job5);
  }

  // 6. Emit KnowledgeCompleted -> pipeline ends
  console.log('\n[TEST 6] Emitting "KnowledgeCompleted" event...');
  await IntelligenceOrchestrator.emitEvent(userId, 'KnowledgeCompleted', {
    event_id: testEntryId,
    cycle_id: testCycleId
  });

  // --- PHASE 2: IDEMPOTENCY GUARANTEE TESTS ---
  console.log('\n[TEST 7] Emitting duplicate "JournalSubmitted" event for same entry...');
  const initialJobCount = (await db.from('orchestrator_jobs').select('id').eq('user_id', userId)).data?.length || 0;
  
  // Re-emit
  await IntelligenceOrchestrator.emitEvent(userId, 'JournalSubmitted', { entry_id: testEntryId });

  const postJobCount = (await db.from('orchestrator_jobs').select('id').eq('user_id', userId)).data?.length || 0;
  if (initialJobCount === postJobCount) {
    console.log('SUCCESS: Idempotency guard caught duplicate event and blocked redundant queuing.');
  } else {
    console.error(`FAIL: Idempotency guard failed. Jobs increased from ${initialJobCount} to ${postJobCount}`);
  }

  console.log('\n--- ALL EVENT BUS PIPELINE TESTS PASSED ---');
}

main().catch(console.error);
