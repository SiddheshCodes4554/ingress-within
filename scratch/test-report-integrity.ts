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

  // Find a test user and cycle
  const { data: users } = await supabase.from('users').select('id').limit(1);
  if (!users || users.length === 0) {
    throw new Error('No users found in database.');
  }
  const testUserId = users[0].id;

  const { data: cycles } = await supabase
    .from('cycles')
    .select('id')
    .eq('user_id', testUserId)
    .limit(1);

  if (!cycles || cycles.length === 0) {
    throw new Error('No cycles found for user.');
  }
  const testCycleId = cycles[0].id;

  console.log(`User ID:  ${testUserId}`);
  console.log(`Cycle ID: ${testCycleId}\n`);

  const weekNum = 2; // Let's use week 2 for safety

  // Cleanup old test weekly summaries
  await supabase.from('weekly_summaries').delete().eq('cycle_id', testCycleId).eq('week_number', weekNum);

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
  const testEntryDate = new Date();
  
  // Remove existing entries for this week range to start fresh
  await supabase.from('entries').delete().eq('cycle_id', testCycleId).eq('cycle_day', 8);

  const { data: entry, error: entryInsertErr } = await supabase
    .from('entries')
    .insert({
      user_id: testUserId,
      cycle_id: testCycleId,
      cycle_day: 8,
      content: 'I felt some mild tension today, but generally kept my composure.',
      entry_type: 'journal',
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
    throw new Error(`Failed to create test entry: ${entryInsertErr?.message}`);
  }
  console.log(`Created test entry: ${entry.id} (Day 8, User: ${entry.user_id})`);

  // Verify True Cycle Start Date Logic:
  // Fetch first completed entry
  const { data: firstEntry } = await supabase
    .from('entries')
    .select('created_at')
    .eq('user_id', testUserId)
    .eq('cycle_id', testCycleId)
    .neq('entry_type', 'empty')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  console.log(`User's first completed entry date in cycle: ${firstEntry?.created_at}`);

  // Test 1: Verification failure (Integrity Violation)
  console.log('\n--- TEST 1: Source Validation Fails on Foreign/Mismatched Crisis Log ---');
  
  // Insert a crisis event belonging to a foreign user/entry ID or wrong week
  const { data: badCrisisLog } = await supabase
    .from('crisis_log')
    .insert({
      user_id: testUserId,
      entry_id: '00000000-0000-0000-0000-000000000000', // Foreign/non-existent entry ID!
      cycle_id: testCycleId,
      week_number: weekNum,
      journal_date: new Date().toISOString().split('T')[0],
      crisis_type: 'Immediate',
      timestamp: testEntryDate.toISOString()
    })
    .select()
    .single();

  // Run weekly summary worker
  let validationThrew = false;
  try {
    await processWeeklySummary({
      cycle_id: testCycleId,
      user_id: testUserId,
      week_number: weekNum,
      summary_id: summary.id
    });
  } catch (err: any) {
    validationThrew = true;
    console.log(`Expected validation error thrown: "${err.message}"`);
  }

  // Fetch summary row to ensure status was updated to FAILED
  const { data: summaryAfterFail } = await supabase
    .from('weekly_summaries')
    .select('*')
    .eq('id', summary.id)
    .single();

  console.log(`Summary status after failed validation: ${summaryAfterFail?.status}`);
  console.log(`Summary body error message: ${summaryAfterFail?.body}`);

  if (!validationThrew || summaryAfterFail?.status !== 'FAILED') {
    throw new Error('FAIL: Validation check should have failed and updated status to FAILED.');
  }
  console.log('PASS: Mismatched crisis log successfully blocked report generation.');

  // Clean up bad crisis log
  if (badCrisisLog) {
    await supabase.from('crisis_log').delete().eq('id', badCrisisLog.id);
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
}

runTests().catch(console.error);
