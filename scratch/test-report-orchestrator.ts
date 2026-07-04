import fs from 'fs';
import path from 'path';

// 1. Load .env file
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
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

// Ensure BYPASS_REDIS is true, grace period is short, and Groq is mocked for testing
process.env.BYPASS_REDIS = 'true';
process.env.WEEKLY_REPORT_GRACE_PERIOD_MS = '2000'; // 2 seconds grace period
process.env.GROQ_API_KEY = 'gsk_development_mock_key_replace_me';

async function testOrchestrator() {
  console.log('=== Ingress Within: Weekly Report Orchestrator Verification ===\n');

  const { supabase } = await import('../src/lib/db');
  const { checkWeeklyAndMonthlySummary } = await import('../src/lib/queue/triggers');
  const { weeklyReportOrchestrator } = await import('../src/lib/weeklyReportOrchestrator');
  const { processEntryScoring } = await import('../src/lib/queue/workers/entryScoringWorker');
  const { processCrisisDetection } = await import('../src/lib/queue/workers/crisisDetectionWorker');
  const { processReflectionGeneration } = await import('../src/lib/queue/workers/reflectionWorker');
  const { processVocabularyExtraction } = await import('../src/lib/queue/workers/vocabWorker');

  // Find a test user and cycle
  const { data: users, error: userErr } = await supabase.from('users').select('id').limit(1);
  if (userErr || !users || users.length === 0) {
    console.error('No users found in database.');
    return;
  }
  const testUserId = users[0].id;

  const { data: cycles, error: cycleErr } = await supabase
    .from('cycles')
    .select('id')
    .eq('user_id', testUserId)
    .limit(1);
  
  if (cycleErr || !cycles || cycles.length === 0) {
    console.error('No cycles found for user.');
    return;
  }
  const testCycleId = cycles[0].id;

  console.log(`Test User ID:  ${testUserId}`);
  console.log(`Test Cycle ID: ${testCycleId}\n`);

  // Define cycle day 7 for milestone check
  const testCycleDay = 7;
  const testWeekNumber = 1;

  // Clean up any existing weekly summaries and entries for this week & cycle to start fresh
  const { data: summariesToDelete } = await supabase
    .from('weekly_summaries')
    .select('id')
    .eq('cycle_id', testCycleId)
    .eq('week_number', testWeekNumber);
  
  if (summariesToDelete && summariesToDelete.length > 0) {
    const summaryIds = summariesToDelete.map(s => s.id);
    await supabase
      .from('open_threads')
      .delete()
      .in('source_summary_id', summaryIds);
  }

  await supabase
    .from('weekly_summaries')
    .delete()
    .eq('cycle_id', testCycleId)
    .eq('week_number', testWeekNumber);

  await supabase
    .from('entries')
    .delete()
    .eq('cycle_id', testCycleId)
    .eq('cycle_day', testCycleDay);

  // Insert a test entry for day 7
  const { data: newEntry, error: entryInsertErr } = await supabase
    .from('entries')
    .insert({
      user_id: testUserId,
      cycle_id: testCycleId,
      cycle_day: testCycleDay,
      content: 'Today was a productive day. I resolved all outstanding architecture tasks and felt a great sense of relief.',
      word_count: 17,
      entry_type: 'new_only',
      scoring_status: 'pending',
      crisis_checked: false,
      vocab_processed: false
    })
    .select()
    .single();

  if (entryInsertErr || !newEntry) {
    console.error('Failed to create test entry:', entryInsertErr?.message);
    return;
  }

  console.log(`Created Day 7 Journal Entry: ${newEntry.id}`);

  // Test Step 1: Detect Week Completion and initialize orchestration state
  console.log('\n--- Step 1: Running Milestone Check ---');
  await checkWeeklyAndMonthlySummary(testUserId, testCycleId, 8); // Triggered by entry on Day 8 (next week)

  // Fetch the summary row to inspect status
  const { data: summary, error: fetchErr } = await supabase
    .from('weekly_summaries')
    .select('*')
    .eq('cycle_id', testCycleId)
    .eq('week_number', testWeekNumber)
    .single();

  if (fetchErr || !summary) {
    console.error('Failed to fetch weekly summary row:', fetchErr?.message);
    return;
  }

  console.log(`Weekly Summary ID: ${summary.id}`);
  console.log(`Initial Status:    ${summary.status}`);
  console.log(`Orchestration State Initialized:`, JSON.stringify(summary.report_data?.orchestration, null, 2));

  if (summary.report_data?.orchestration?.status !== 'waiting_for_scoring') {
    console.error('FAIL: Initial status should be waiting_for_scoring');
    return;
  }
  console.log('SUCCESS: Initial status and state setup correctly.');

  // Simulate pipeline execution
  console.log('\n--- Step 2: Simulating Background Job Pipeline ---');

  console.log('\nRunning Scoring Worker (chains Crisis -> Reflection -> Vocabulary in BYPASS_REDIS mode)...');
  await processEntryScoring({ entry_id: newEntry.id, user_id: testUserId });

  // Check state after the full pipeline runs inline
  const { data: summaryAfterPipeline } = await supabase
    .from('weekly_summaries')
    .select('*')
    .eq('id', summary.id)
    .single();

  console.log(`Orchestration Status: ${summaryAfterPipeline?.report_data?.orchestration?.status}`);
  console.log(`Completed events:`, summaryAfterPipeline?.report_data?.orchestration?.completed_events);

  if (summaryAfterPipeline?.report_data?.orchestration?.status !== 'grace_period') {
    console.error('FAIL: Status should have transitioned to grace_period!');
    return;
  }
  console.log('SUCCESS: All required pipeline steps completed. Status is grace_period.');

  // Wait for grace period timer (2.0s) + report generation (~3.0s) to fully complete
  console.log('\n--- Step 3: Waiting for Grace Period Timer & Report Generation ---');
  await new Promise(resolve => setTimeout(resolve, 6000));

  // Check final status of report
  const { data: finalSummary } = await supabase
    .from('weekly_summaries')
    .select('*')
    .eq('id', summary.id)
    .single();

  console.log(`Final Report Status: ${finalSummary?.status}`);
  console.log(`Report Title:        ${finalSummary?.title}`);
  console.log(`Report Why:          ${finalSummary?.why}`);
  console.log(`Report data (narrative):`, finalSummary?.report_data?.week_narrative || finalSummary?.body);

  if (finalSummary?.status !== 'ready') {
    console.error('FAIL: Report status should be ready!');
    return;
  }
  console.log('SUCCESS: Event-driven orchestrator successfully validated and generated the weekly report!');

  // Cleanup test entry and summary
  console.log('\nCleaning up test data...');
  await supabase.from('entries').delete().eq('id', newEntry.id);
  await supabase.from('reflections').delete().eq('entry_id', newEntry.id);
  await supabase.from('threads').delete().eq('reflection_id', finalSummary.id);
  await supabase.from('weekly_summaries').delete().eq('id', summary.id);

  console.log('Verification completed successfully!');
}

testOrchestrator().catch(console.error);
