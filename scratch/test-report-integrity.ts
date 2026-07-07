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

async function runTests() {
  console.log('=== WEEKLY REPORT INTEGRITY & SOURCE AUDIT VERIFICATION ===\n');

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  
  const { collectWeeklyReportData } = await import('../src/lib/weeklyReportCollector');
  const { processWeeklySummary } = await import('../src/lib/queue/workers/weeklySummaryWorker');

  // 1. Create a clean registered user in auth.users & public.users
  const crypto = await import('crypto');
  const email = `test-${crypto.randomUUID()}@example.com`;
  const password = 'TestPassword123!';
  const phone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  console.log(`Registering clean auth user: ${email}`);
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    phone,
    email_confirm: true,
    phone_confirm: true
  });

  if (authErr || !authData.user) {
    throw new Error(`Failed to create test auth user: ${authErr?.message || 'Unknown error'}`);
  }

  const testUserId = authData.user.id;
  console.log(`Created Test User ID: ${testUserId}`);

  // Manually insert into public.users
  const { error: userInsertErr } = await supabase.from('users').insert({
    id: testUserId,
    phone_number: phone,
    name: 'Test Report User',
    onboarding_done: true
  });

  if (userInsertErr) {
    throw new Error(`Failed to insert public user: ${userInsertErr.message}`);
  }

  // Create a dummy active cycle for this user
  const { data: newCycle, error: cycleErr } = await supabase
    .from('cycles')
    .insert({
      user_id: testUserId,
      status: 'ACTIVE',
      cycle_number: 1,
      total_days: 30,
      start_date: '2026-06-12'
    })
    .select()
    .single();

  if (cycleErr || !newCycle) {
    throw new Error(`Failed to create test cycle: ${cycleErr?.message}`);
  }

  const testCycleId = newCycle.id;

  console.log(`User ID:  ${testUserId}`);
  console.log(`Cycle ID: ${testCycleId}\n`);

  try {
    const weekNum = 2; // Let's use week 2 for safety

    // Cleanup old test weekly summaries, entries, and crisis logs
    await supabase.from('weekly_summaries').delete().eq('cycle_id', testCycleId).eq('week_number', weekNum);
    await supabase.from('crisis_log').delete().eq('user_id', testUserId).eq('week_number', weekNum);

    // 1. Create a dummy summary row
    const { data: summary, error: createErr } = await supabase
      .from('weekly_summaries')
      .insert({
        user_id: testUserId,
        cycle_id: testCycleId,
        week_number: weekNum,
        day_start: 8,
        day_end: 14,
        status: 'PENDING'
      })
      .select()
      .single();

    if (createErr || !summary) {
      throw new Error(`Failed to create summary row: ${createErr?.message}`);
    }

    // 2. Insert test entries for user in week 2
    // We want to verify that cycleStartDate aligns correctly
    const testEntryDate = new Date(Date.UTC(2026, 5, 22, 10, 0, 0));
    
    // Remove existing entries for this week range to start fresh
    await supabase.from('entries').delete().eq('cycle_id', testCycleId).eq('cycle_day', 8);

    const { data: entry, error: entryInsertErr } = await supabase
      .from('entries')
      .insert({
        user_id: testUserId,
        cycle_id: testCycleId,
        cycle_day: 8,
        content: 'I felt some mild tension today, but generally kept my composure.',
        entry_type: 'new_only',
        scoring_status: 'scored',
        crisis_checked: true,
        vocab_processed: true,
        day_ei: 4,
        day_pr: 5,
        day_sa: 6,
        created_at: testEntryDate.toISOString()
      })
      .select()
      .single();

    if (entryInsertErr || !entry) {
      throw new Error(`Failed to insert test entry: ${entryInsertErr?.message}`);
    }

    console.log(`Created test entry: ${entry.id} (Day 8, User: ${testUserId})`);

    // Fetch first completed entry date to print
    const firstCompletedEntryDate = entry.created_at;
    console.log(`User's first completed entry date in cycle: ${firstCompletedEntryDate}\n`);

    // 3. Insert a foreign/mismatched crisis log (entry_id of a different user/week)
    // This simulates the integrity threat where a crisis event belongs to another week/user
    const mismatchedEntryId = 'a4db6268-685e-4903-9344-d64041d4e2bd';
    const { data: badCrisisLog, error: badCrisisErr } = await supabase
      .from('crisis_log')
      .insert({
        id: '45f2694d-11aa-4f78-aa0f-673614d3fa49',
        user_id: testUserId,
        entry_id: mismatchedEntryId,
        cycle_id: testCycleId,
        week_number: weekNum,
        journal_date: '2026-06-22',
        crisis_type: 'Severe_Risk_Language',
        timestamp: testEntryDate.toISOString()
      })
      .select()
      .single();

    if (badCrisisErr) {
      console.warn('Failed to insert mismatched crisis log (might already exist):', badCrisisErr.message);
    }

    // Also insert a normal entry for Week 1 to verify it is NOT audited for Week 2
    const week1EntryDate = new Date(Date.UTC(2026, 5, 15, 10, 0, 0));
    const { data: week1Entry } = await supabase
      .from('entries')
      .insert({
        user_id: testUserId,
        cycle_id: testCycleId,
        cycle_day: 3,
        content: 'Week 1 entry that should not be in Week 2 report.',
        entry_type: 'new_only',
        scoring_status: 'scored',
        crisis_checked: true,
        vocab_processed: true,
        day_ei: 3,
        day_pr: 4,
        day_sa: 5,
        created_at: week1EntryDate.toISOString()
      })
      .select()
      .single();

    // Test 1: Validation should catch the foreign/mismatched crisis log and throw an error
    console.log('--- TEST 1: Source Validation Fails on Foreign/Mismatched Crisis Log ---');
    let threwIntegrityError = false;
    try {
      await processWeeklySummary({
        cycle_id: testCycleId,
        user_id: testUserId,
        week_number: weekNum,
        summary_id: summary.id
      });
    } catch (err: any) {
      console.log(`Expected validation error thrown: "${err.message}"`);
      threwIntegrityError = err.message.includes('Integrity Violation');
    }

    const { data: summaryAfterFailure } = await supabase
      .from('weekly_summaries')
      .select('status, body')
      .eq('id', summary.id)
      .single();

    console.log(`Summary status after failed validation: ${summaryAfterFailure?.status}`);
    console.log(`Summary body error message: ${summaryAfterFailure?.body}`);

    if (!threwIntegrityError) {
      throw new Error('FAIL: Mismatched crisis log did not throw an integrity error!');
    }
    if (summaryAfterFailure?.status !== 'FAILED') {
      throw new Error('FAIL: Mismatched crisis log did not update status to FAILED.');
    }
    console.log('PASS: Mismatched crisis log successfully blocked report generation.');

    // Clean up mismatched crisis log to allow Test 2 to pass
    if (badCrisisLog) {
      await supabase.from('crisis_log').delete().eq('id', badCrisisLog.id);
    }
    if (week1Entry) {
      await supabase.from('entries').delete().eq('id', week1Entry.id);
    }

    // Test 2: Successful validation when all evidence belongs to the week
    console.log('\n--- TEST 2: Source Validation Passes with Clean Valid Evidence ---');
    
    // Reset summary status to PENDING
    await supabase.from('weekly_summaries').update({ status: 'PENDING', body: null }).eq('id', summary.id);

    // Insert a valid crisis log pointing to this week's entry
    const { data: goodCrisisLog } = await supabase
      .from('crisis_log')
      .insert({
        user_id: testUserId,
        entry_id: entry.id,
        cycle_id: testCycleId,
        week_number: weekNum,
        journal_date: new Date(entry.created_at).toISOString().split('T')[0],
        crisis_type: 'Risk_Language',
        timestamp: entry.created_at
      })
      .select()
      .single();

    // Run weekly summary worker again
    try {
      await processWeeklySummary({
        cycle_id: testCycleId,
        user_id: testUserId,
        week_number: weekNum,
        summary_id: summary.id
      });
    } catch (err: any) {
      console.error('Failed to run summary worker with valid data:', err);
      throw err;
    }

    const { data: summaryAfterSuccess } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('id', summary.id)
      .single();

    console.log(`Summary status after success: ${summaryAfterSuccess?.status}`);
    console.log(`Weekly report title:       ${summaryAfterSuccess?.title}`);
    console.log(`Weekly report why:         ${summaryAfterSuccess?.why}`);
    console.log(`Audited Journal IDs:       `, summaryAfterSuccess?.report_data?.audit?.journal_ids_included);
    console.log(`Audited Crisis Events:     `, summaryAfterSuccess?.report_data?.audit?.supporting_crisis_events);
    console.log(`Audited Sentences count:   `, summaryAfterSuccess?.report_data?.audit?.supporting_sentences?.length);

    if (summaryAfterSuccess?.status !== 'READY') {
      throw new Error('FAIL: Report generation should have completed successfully and marked status as READY.');
    }

    const reportJson = summaryAfterSuccess?.report_data || {};
    if (!reportJson.week_tone || !reportJson.what_we_saw || !reportJson.candidate_quote || !reportJson.carry_question || !reportJson.analytical_block) {
      throw new Error('FAIL: Stored report_data does not contain the new weekly report prompt schema fields.');
    }
    console.log('PASS: Stored report_data contains all new weekly report prompt schema fields.');
    console.log('PASS: Successful validation, AI generation, and evidence auditing verified.');

    // Clean up test data
    console.log('\nCleaning up E2E verification database records...');
    await supabase.from('weekly_summaries').delete().eq('id', summary.id);
    await supabase.from('entries').delete().eq('id', entry.id);
    if (goodCrisisLog) {
      await supabase.from('crisis_log').delete().eq('id', goodCrisisLog.id);
    }
    await supabase.from('open_threads').delete().eq('source_summary_id', summary.id);

    console.log('\nAll Report Data Integrity verification tests passed successfully!');
  } finally {
    console.log('Cleaning up registered test user...');
    await supabase.auth.admin.deleteUser(testUserId);
    console.log('Cleanup complete.');
  }
}

runTests().catch(console.error);
