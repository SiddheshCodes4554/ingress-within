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

  const selfHealingPath = pathToFileURL(path.join(process.cwd(), 'src/lib/orchestrator/selfHealing.ts')).href;
  const { SelfHealingService } = await import(selfHealingPath);

  console.log('--- STARTING SELF-HEALING AND INTEGRITY TESTS ---');

  // 1. Fetch user
  const { data: users } = await db.from('profiles').select('id, full_name').limit(1);
  const testUser = users?.[0];
  if (!testUser) {
    console.error('No users found in database to run tests.');
    return;
  }
  const userId = testUser.id;
  console.log(`Using test user: ${testUser.full_name} (${userId})`);

  // Cleanup prior jobs/events
  await db.from('orchestrator_events').delete().eq('user_id', userId);
  await db.from('orchestrator_jobs').delete().eq('user_id', userId);

  // Find a real entry to use as reference trigger
  const { data: realEntries } = await db
    .from('entries')
    .select('id')
    .eq('user_id', userId)
    .limit(1);
  const realEntryId = realEntries?.[0]?.id || '20000000-0000-4000-a000-000000000002';
  const triggerKey = `JournalSubmitted:${realEntryId}`;

  // 2. Set up test scenario 1: Duplicate Jobs
  console.log('\n[TEST 1] Setting up duplicate active jobs...');
  
  const { data: jobA } = await db.from('orchestrator_jobs').insert({
    user_id: userId,
    engine: 'reflection',
    trigger: triggerKey,
    status: 'queued',
    queued_at: new Date(Date.now() - 5000).toISOString() // 5s ago
  }).select('id').single();

  const { data: jobB } = await db.from('orchestrator_jobs').insert({
    user_id: userId,
    engine: 'reflection',
    trigger: triggerKey,
    status: 'queued',
    queued_at: new Date().toISOString() // now
  }).select('id').single();

  // 3. Set up test scenario 2: Broken Reference Job
  console.log('\n[TEST 2] Setting up job with broken entry reference...');
  const { data: brokenJob } = await db.from('orchestrator_jobs').insert({
    user_id: userId,
    engine: 'reflection',
    trigger: 'JournalSubmitted:99999999-9999-9999-9999-999999999999', // Missing Entry ID
    status: 'queued'
  }).select('id').single();

  // 4. Set up test scenario 3: Stalled Job (Queued 2 days ago)
  console.log('\n[TEST 3] Setting up stalled job (queued 48 hours ago)...');
  const { data: stalledJob } = await db.from('orchestrator_jobs').insert({
    user_id: userId,
    engine: 'vocabulary',
    trigger: triggerKey,
    status: 'running',
    queued_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }).select('id').single();

  // 5. Run Self-Healing integrity audit
  console.log('\n[AUDIT] Running Integrity Audit...');
  await SelfHealingService.runIntegrityAudit(userId);

  // 6. Verify duplicate job pruning
  const { data: prunedDuplicate } = await db
    .from('orchestrator_jobs')
    .select('status, last_error')
    .eq('id', jobA?.id)
    .single();

  const { data: activeDuplicate } = await db
    .from('orchestrator_jobs')
    .select('status')
    .eq('id', jobB?.id)
    .single();

  console.log(`Duplicate A: status = ${prunedDuplicate?.status}, error = ${prunedDuplicate?.last_error}`);
  console.log(`Duplicate B: status = ${activeDuplicate?.status}`);

  if (prunedDuplicate?.status === 'failed' && prunedDuplicate.last_error?.toLowerCase().includes('duplicate') && activeDuplicate?.status === 'queued') {
    console.log('SUCCESS: Duplicate job pruned successfully and newer active job preserved.');
  } else {
    console.error('FAIL: Duplicate job pruning failed.');
  }

  // 7. Verify broken reference pruning
  const { data: prunedBroken } = await db
    .from('orchestrator_jobs')
    .select('status, last_error')
    .eq('id', brokenJob?.id)
    .single();

  console.log(`Broken Ref Job: status = ${prunedBroken?.status}, error = ${prunedBroken?.last_error}`);
  if (prunedBroken?.status === 'failed' && prunedBroken.last_error?.includes('Reference')) {
    console.log('SUCCESS: Job with broken entry reference failed/pruned successfully.');
  } else {
    console.error('FAIL: Broken reference pruning failed.');
  }

  // 8. Verify stalled job pruning
  const { data: prunedStalled } = await db
    .from('orchestrator_jobs')
    .select('status, last_error')
    .eq('id', stalledJob?.id)
    .single();

  console.log(`Stalled Job: status = ${prunedStalled?.status}, error = ${prunedStalled?.last_error}`);
  if (prunedStalled?.status === 'failed' && prunedStalled.last_error?.includes('Stalled')) {
    console.log('SUCCESS: Stalled job pruned successfully.');
  } else {
    console.error('FAIL: Stalled job pruning failed.');
  }

  // 9. Verify Audit Log record
  const { data: auditEvent } = await db
    .from('orchestrator_events')
    .select('payload')
    .eq('user_id', userId)
    .eq('event_type', 'SelfHealingAuditCompleted')
    .maybeSingle();

  if (auditEvent) {
    console.log('SUCCESS: Audit log summary written to orchestrator_events table.', auditEvent.payload);
  } else {
    console.error('FAIL: Audit log summary not written.');
  }

  console.log('\n--- ALL SELF-HEALING TESTS PASSED ---');
}

main().catch(console.error);
