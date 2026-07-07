import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ─── Load Environment Variables FIRST ──────────────────────────────────────────
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

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function runTests() {
  console.log('=== Ingress Within: Pattern Engine V1 E2E Verification ===\n');

  // Dynamically import DB and Intelligence layer after env vars are populated
  const { supabase } = await import('../db');
  const { PatternIntelligenceService } = await import('./patternIntelligenceService');

  // 1. Create a clean registered user in auth.users
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

  if (authErr) {
    throw new Error(`Failed to create test auth user: ${authErr.message}`);
  }

  const testUserId = authData.user!.id;
  console.log(`Created Test User ID: ${testUserId}`);

  // Manually insert into public.users since there is no trigger
  const { error: pubUserErr } = await supabase.from('users').insert({
    id: testUserId,
    phone_number: phone
  });
  if (pubUserErr) {
    // Cleanup if insertion failed
    await supabase.auth.admin.deleteUser(testUserId);
    throw new Error(`Failed to insert into public.users: ${pubUserErr.message}`);
  }

  try {
    const cycle1Id = crypto.randomUUID();
    const weeklySummary1Id = crypto.randomUUID();

    console.log(`Cycle 1 ID: ${cycle1Id}`);
    console.log(`Weekly Summary 1 ID: ${weeklySummary1Id}`);

    // Insert Cycle 1 (Active)
    const { error: insC1Err } = await supabase.from('cycles').insert({
      id: cycle1Id,
      user_id: testUserId,
      cycle_number: 1,
      status: 'ACTIVE',
      start_date: new Date().toISOString().split('T')[0],
      total_days: 30
    });
    if (insC1Err) throw new Error(`Insert Cycle 1 failed: ${insC1Err.message}`);

    // Insert weekly report summary
    const reportData = {
      vocabThisWeek: [
        { word: "fine", normalized_word: "fine", frequency: 3, sentence: "I kept saying I am fine." }
      ],
      scores: [
        { cycle_day: 1, ei: 5, pr: 6, sa: 2 },
        { cycle_day: 3, ei: 6, pr: 7, sa: 2 }
      ],
      threadResponses: [
        { response_text: "I agreed to avoid trouble because I don't like conflicts.", question: "How do you handle disagreement?" }
      ]
    };

    const { error: wsErr } = await supabase.from('weekly_summaries').insert({
      id: weeklySummary1Id,
      user_id: testUserId,
      cycle_id: cycle1Id,
      week_number: 1,
      title: 'Week 1 Reflections',
      body: 'Highly focus on keeping things peaceful and avoiding any arguments.',
      why: 'Avoiding conflict arises from self-pressure to be liked.',
      status: 'READY',
      day_start: 1,
      day_end: 7,
      report_data: reportData,
      created_at: new Date().toISOString()
    });
    if (wsErr) throw new Error(`Insert weekly summary failed: ${wsErr.message}`);

    // Insert entry for this week
    const { error: entryErr } = await supabase.from('entries').insert({
      user_id: testUserId,
      cycle_id: cycle1Id,
      cycle_day: 2,
      content: 'I stayed quiet and did not share my opinions to prevent disagreement. I felt very small.',
      new_entry_text_encrypted: null,
      new_entry_text_iv: null,
      word_count: 15
    });
    if (entryErr) throw new Error(`Insert journal entry failed: ${entryErr.message}`);

    console.log('\n--- Test 1: Generate weekly snapshot using AI and multi-source inputs ---');
    await PatternIntelligenceService.generateSnapshotForWeeklyReport(testUserId, weeklySummary1Id);

    // Verify snapshot was created
    const { data: snapshotData, error: snapErr } = await supabase
      .from('pattern_snapshots')
      .select('*')
      .eq('user_id', testUserId)
      .eq('cycle_id', weeklySummary1Id)
      .maybeSingle();

    if (snapErr) throw snapErr;
    assert(!!snapshotData, 'Weekly snapshot should be saved to database');
    console.log('Snapshot Data:', JSON.stringify(snapshotData?.snapshot_data, null, 2));

    const patterns = snapshotData?.snapshot_data?.patterns || [];
    assert(patterns.length > 0, 'Should have extracted at least one pattern from the weekly report inputs');

    console.log('\n--- Test 2: Fetch Pattern Overview ---');
    const overview = await PatternIntelligenceService.getPatternOverview(testUserId);
    assert(overview.isAvailable, 'Overview should be available');
    assert(overview.patterns.length > 0, 'Overview should return the extracted pattern(s)');
    console.log('Overview Patterns:', overview.patterns.map(p => ({ name: p.name, status: p.status, meta: p.meta })));

    const firstPattern = overview.patterns[0];
    console.log(`\n--- Test 3: Fetch Pattern Detail for "${firstPattern.name}" ---`);
    const detail = await PatternIntelligenceService.getPatternDetail(testUserId, firstPattern.name);
    assert(detail !== null, 'Should return pattern detail object');
    assert(detail?.name === firstPattern.name, 'Detail name matches requested pattern');
    console.log('Detail Timeline:', detail?.timeline);
    console.log('Detail Evidence Quotes:', detail?.cycleData[1]?.entries);

    console.log('\n=== All Pattern Engine V1 E2E Verification Tests Passed Successfully! ===\n');

  } finally {
    console.log('Cleaning up registered test user and all cascades...');
    await supabase.from('pattern_snapshots').delete().eq('user_id', testUserId);
    await supabase.from('weekly_summaries').delete().eq('user_id', testUserId);
    await supabase.from('entries').delete().eq('user_id', testUserId);
    await supabase.from('cycles').delete().eq('user_id', testUserId);
    await supabase.from('users').delete().eq('id', testUserId);
    await supabase.auth.admin.deleteUser(testUserId);
    console.log('Cleanup complete.');
  }
}

runTests().catch(err => {
  console.error('\n❌ Test execution failed with error:', err);
  process.exit(1);
});
