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

// Ensure BYPASS_REDIS is true and grace period is short for testing
process.env.BYPASS_REDIS = 'true';
process.env.WEEKLY_REPORT_GRACE_PERIOD_MS = '1000'; // 1 second grace period

async function runTests() {
  console.log('=== WEEKLY REPORT STATE MACHINE V2 VERIFICATION ===\n');

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  const { checkWeeklyAndMonthlySummary } = await import('../src/lib/queue/triggers');
  const { weeklyReportOrchestrator } = await import('../src/lib/weeklyReportOrchestrator');
  const { queueRegistry } = await import('../src/lib/queue/registry');

  // Find a test user and cycle
  const { data: users } = await supabase.from('users').select('id').limit(1);
  if (!users || users.length === 0) {
    throw new Error('No users found in database.');
  }
  const testUserId = users[0].id;

  let testCycleId = '';
  const { data: cycles, error: cycleErr } = await supabase
    .from('cycles')
    .select('id, cycle_number')
    .eq('user_id', testUserId)
    .limit(1);

  console.log('Cycles Query Data:', cycles);
  console.log('Cycles Query Error:', cycleErr);
  
  if (!cycles || cycles.length === 0) {
    console.log('No cycles found. Provisioning a dummy cycle...');
    const { data: newCycle, error: cycleInsertErr } = await supabase
      .from('cycles')
      .insert({
        user_id: testUserId,
        status: 'ACTIVE',
        cycle_number: 1,
        total_days: 30,
        start_date: new Date().toISOString()
      })
      .select()
      .single();

    if (cycleInsertErr || !newCycle) {
      throw new Error(`Failed to provision dummy cycle: ${cycleInsertErr?.message}`);
    }
    testCycleId = newCycle.id;
  } else {
    testCycleId = cycles[0].id;
  }
  const cycleNum = cycles && cycles.length > 0 ? (cycles[0].cycle_number || cycles[0].number || 1) : 1;

  console.log(`User ID:  ${testUserId}`);
  console.log(`Cycle ID: ${testCycleId}\n`);

  const weekNum = 1;

  // Cleanup old test records
  await supabase.from('weekly_summaries').delete().eq('cycle_id', testCycleId).eq('week_number', weekNum);

  // Test 1: State Machine Transition Check
  console.log('--- TEST 1: Initializing Weekly Summary Row ---');
  const initialOrchestration = {
    orchestration: {
      status: 'WAITING_FOR_PROCESSING',
      entry_id: '',
      completed_events: {
        'SCORING_COMPLETED': false,
        'REFLECTION_COMPLETED': false,
        'CRISIS_COMPLETED': false,
        'VOCABULARY_COMPLETED': false,
        'THREADS_COMPLETED': false,
        'CYCLE_METADATA_UPDATED': false
      },
      history: [],
      updated_at: new Date().toISOString()
    }
  };

  const { data: summary, error: createErr } = await supabase
    .from('weekly_summaries')
    .insert({
      user_id: testUserId,
      cycle_id: testCycleId,
      week_number: weekNum,
      day_start: 1,
      day_end: 7,
      status: 'PENDING',
      report_data: initialOrchestration
    })
    .select()
    .single();

  if (createErr || !summary) {
    throw new Error(`Failed to create summary row: ${createErr?.message}`);
  }
  console.log(`Summary created. ID: ${summary.id}, status: ${summary.status}`);
  if (summary.status !== 'PENDING') throw new Error('Status should be PENDING upon insert!');

  // Test 2: Emit Event transitions status to WAITING_FOR_PROCESSING
  console.log('\n--- TEST 2: Emitting Single Event ---');
  await weeklyReportOrchestrator.emitEvent({
    user_id: testUserId,
    entry_id: 'some-entry-id',
    cycle_id: testCycleId,
    week_number: weekNum,
    job_name: 'SCORING_COMPLETED',
    completed_at: new Date().toISOString(),
    status: 'success'
  });

  const { data: sAfterEvent } = await supabase.from('weekly_summaries').select('*').eq('id', summary.id).single();
  console.log(`Summary status after event: ${sAfterEvent?.status}`);
  if (sAfterEvent?.status !== 'WAITING_FOR_PROCESSING') {
    throw new Error('Status should be WAITING_FOR_PROCESSING since some events are missing!');
  }
  console.log('PASS: Successfully transitioned to WAITING_FOR_PROCESSING.');

  // Test 3: Emitting all events transitions status to GRACE_PERIOD
  console.log('\n--- TEST 3: Emitting All Required Events ---');
  const requiredEvents = [
    'REFLECTION_COMPLETED',
    'CRISIS_COMPLETED',
    'VOCABULARY_COMPLETED',
    'THREADS_COMPLETED',
    'CYCLE_METADATA_UPDATED'
  ];

  for (const ev of requiredEvents) {
    await weeklyReportOrchestrator.emitEvent({
      user_id: testUserId,
      entry_id: 'some-entry-id',
      cycle_id: testCycleId,
      week_number: weekNum,
      job_name: ev,
      completed_at: new Date().toISOString(),
      status: 'success'
    });
  }

  const { data: sAfterAllEvents } = await supabase.from('weekly_summaries').select('*').eq('id', summary.id).single();
  console.log(`Summary status after all events: ${sAfterAllEvents?.status}`);
  if (sAfterAllEvents?.status !== 'GRACE_PERIOD') {
    throw new Error('Status should be GRACE_PERIOD!');
  }
  console.log('PASS: Successfully transitioned to GRACE_PERIOD and started grace timer.');

  // Test 4: Immutability Guard Verification
  console.log('\n--- TEST 4: Verifying READY Immutability Guard ---');
  // Explicitly update summary status to READY
  const { error: readyUpdateErr } = await supabase
    .from('weekly_summaries')
    .update({
      status: 'READY',
      body: 'Existing finalized narrative.',
      title: 'Finalized Title',
      why: 'Finalized Reason'
    })
    .eq('id', summary.id);

  if (readyUpdateErr) throw new Error(`Failed to set status to READY: ${readyUpdateErr.message}`);

  // Attempt to call emitEvent again to verify it is bypassed
  await weeklyReportOrchestrator.emitEvent({
    user_id: testUserId,
    entry_id: 'some-entry-id',
    cycle_id: testCycleId,
    week_number: weekNum,
    job_name: 'SCORING_COMPLETED',
    completed_at: new Date().toISOString(),
    status: 'success'
  });

  const { data: sImmutabilityCheck } = await supabase.from('weekly_summaries').select('*').eq('id', summary.id).single();
  console.log(`Summary status after bypass attempt: ${sImmutabilityCheck?.status}`);
  console.log(`Summary body: ${sImmutabilityCheck?.body}`);
  if (sImmutabilityCheck?.status !== 'READY' || sImmutabilityCheck?.body !== 'Existing finalized narrative.') {
    throw new Error('Immutability Guard failed: READY summary was overwritten or transitioned!');
  }
  console.log('PASS: Immutability Guard verified. READY state is strictly terminal.');

  // Test 5: Deterministic Job ID Deduplication Check
  console.log('\n--- TEST 5: Job ID Deduplication ---');
  const job = await queueRegistry.addJob('weekly_summary_generation', 'dedup_test_job', { test: true });
  console.log(`Scheduled Job ID: ${job.id}`);
  if (job.id !== 'dedup_test_job') {
    throw new Error(`Job ID should be 'dedup_test_job'! Instead got ${job.id}`);
  }
  console.log('PASS: Job ID is deterministic.');

  // Cleanup test summary
  await supabase.from('weekly_summaries').delete().eq('id', summary.id);
  console.log('\nAll Report State Machine V2 checks passed successfully!');
}

runTests().catch(console.error);
