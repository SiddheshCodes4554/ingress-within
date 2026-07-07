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
  console.log('=== Ingress Within: Pattern Engine E2E Verification ===\n');

  // Now dynamically import DB and Intelligence layer after env vars are populated
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
    const cycle2Id = crypto.randomUUID();

    console.log(`Cycle 1 ID: ${cycle1Id}`);
    console.log(`Cycle 2 ID: ${cycle2Id}`);

    // Insert Cycle 1 (completed/archived)
    const { error: insC1Err } = await supabase.from('cycles').insert({
      id: cycle1Id,
      user_id: testUserId,
      cycle_number: 1,
      status: 'ARCHIVED',
      start_date: new Date().toISOString().split('T')[0],
      total_days: 30
    });
    if (insC1Err) throw new Error(`Insert Cycle 1 failed: ${insC1Err.message}`);

    // Insert Cycle 2 (active)
    const { error: insC2Err } = await supabase.from('cycles').insert({
      id: cycle2Id,
      user_id: testUserId,
      cycle_number: 2,
      status: 'ACTIVE',
      start_date: new Date().toISOString().split('T')[0],
      total_days: 30
    });
    if (insC2Err) throw new Error(`Insert Cycle 2 failed: ${insC2Err.message}`);

    // 3. Test confidence filtering and snapshot compilation (Cycle 1)
    console.log('\n--- Test 1: Active Cycle 1 Snapshot Generation ---');
    
    // Insert extractions for Cycle 1
    const c1Extractions = [
      // Avoidance (High confidence & frequency)
      {
        user_id: testUserId,
        cycle_id: cycle1Id,
        source_type: 'journal',
        pattern_name: 'Avoidance',
        pattern_category: 'behavioural',
        supporting_phrase: 'I didn\'t say anything',
        supporting_sentence: 'I didn\'t say anything. It felt easier.',
        confidence: 0.88
      },
      {
        user_id: testUserId,
        cycle_id: cycle1Id,
        source_type: 'journal',
        pattern_name: 'Avoidance',
        pattern_category: 'behavioural',
        supporting_phrase: 'decided to ignore it',
        supporting_sentence: 'I decided to ignore it so we wouldn\'t fight.',
        confidence: 0.92
      },
      // Saying "fine" (High confidence & frequency)
      {
        user_id: testUserId,
        cycle_id: cycle1Id,
        source_type: 'journal',
        pattern_name: 'Saying "fine"',
        pattern_category: 'linguistic',
        supporting_phrase: 'I am fine',
        supporting_sentence: 'I kept telling them I am fine.',
        confidence: 0.85
      },
      {
        user_id: testUserId,
        cycle_id: cycle1Id,
        source_type: 'journal',
        pattern_name: 'Saying "fine"',
        pattern_category: 'linguistic',
        supporting_phrase: 'doing fine',
        supporting_sentence: 'I said I was doing fine, though I felt hollow.',
        confidence: 0.78
      },
      // Low confidence pattern (Should be filtered out of snapshot)
      {
        user_id: testUserId,
        cycle_id: cycle1Id,
        source_type: 'journal',
        pattern_name: 'Rumination',
        pattern_category: 'behavioural',
        supporting_phrase: 'thinking about it',
        supporting_sentence: 'I was thinking about it again today.',
        confidence: 0.52 // below 0.65 threshold
      }
    ];

    const { error: ins1Err } = await supabase.from('pattern_extractions').insert(c1Extractions);
    if (ins1Err) throw ins1Err;

    // Generate snapshot
    await PatternIntelligenceService.generatePatternSnapshot(testUserId, cycle1Id);

    // Fetch and verify
    const overview1 = await PatternIntelligenceService.getPatternOverview(testUserId);
    assert(overview1.isAvailable, 'Overview should be available after snapshot compilation');
    assert(overview1.patterns.length === 2, 'Should only contain patterns with confidence >= 0.65 (Avoidance & Saying "fine")');
    
    const avoidanceCard = overview1.patterns.find(p => p.name === 'Avoidance');
    assert(avoidanceCard !== undefined, 'Avoidance pattern card exists');
    assert(avoidanceCard?.status === 'new', 'First seen pattern should have status "new"');
    assert(avoidanceCard?.timeline[0] === 'new', 'Timeline state for first cycle should be "new"');

    const fineCard = overview1.patterns.find(p => p.name === 'Saying "fine"');
    assert(fineCard !== undefined, 'Saying "fine" pattern card exists');
    assert(fineCard?.status === 'new', 'Saying "fine" status should be "new"');

    // 4. Test snapshot sealing (Immutability)
    console.log('\n--- Test 2: Seal Cycle 1 Snapshot ---');
    await PatternIntelligenceService.sealCycleSnapshot(testUserId, cycle1Id);

    const { data: sealedSnap } = await supabase
      .from('pattern_snapshots')
      .select('snapshot_status')
      .eq('user_id', testUserId)
      .eq('cycle_id', cycle1Id)
      .single();
    assert(sealedSnap?.snapshot_status === 'completed', 'Cycle 1 snapshot status is "completed"');

    // Attempting to modify sealed snapshot should be blocked / ignored
    // Let's insert a new extraction for cycle 1
    await supabase.from('pattern_extractions').insert({
      user_id: testUserId,
      cycle_id: cycle1Id,
      source_type: 'journal',
      pattern_name: 'Rumination',
      pattern_category: 'behavioural',
      supporting_phrase: 'over and over',
      supporting_sentence: 'I replayed it over and over.',
      confidence: 0.95
    });

    await PatternIntelligenceService.generatePatternSnapshot(testUserId, cycle1Id);
    const overviewAfterRegen = await PatternIntelligenceService.getPatternOverview(testUserId);
    const ruminationCard = overviewAfterRegen.patterns.find(p => p.name === 'Rumination');
    assert(ruminationCard === undefined, 'Sealed snapshot was NOT modified (Rumination was not added)');

    // 5. Test Cycle 2 Snapshot Generation & State Transitions
    console.log('\n--- Test 3: Cycle 2 Snapshot Generation & State Transitions ---');
    
    // Insert extractions for Cycle 2
    const c2Extractions = [
      // Avoidance (Lower frequency this cycle -> quiet/absent in cycle 2)
      {
        user_id: testUserId,
        cycle_id: cycle2Id,
        source_type: 'journal',
        pattern_name: 'Avoidance',
        pattern_category: 'behavioural',
        supporting_phrase: 'just walked away',
        supporting_sentence: 'I just walked away from the discussion.',
        confidence: 0.85
      },
      // Saying "fine" (No occurrences this cycle -> quiet)
      // Conflict aversion (New pattern in cycle 2)
      {
        user_id: testUserId,
        cycle_id: cycle2Id,
        source_type: 'journal',
        pattern_name: 'Conflict aversion',
        pattern_category: 'behavioural',
        supporting_phrase: 'didn\'t want trouble',
        supporting_sentence: 'I agreed because I didn\'t want any trouble.',
        confidence: 0.85
      },
      {
        user_id: testUserId,
        cycle_id: cycle2Id,
        source_type: 'journal',
        pattern_name: 'Conflict aversion',
        pattern_category: 'behavioural',
        supporting_phrase: 'keep the peace',
        supporting_sentence: 'I kept my mouth shut to keep the peace.',
        confidence: 0.89
      }
    ];

    const { error: ins2Err } = await supabase.from('pattern_extractions').insert(c2Extractions);
    if (ins2Err) throw ins2Err;

    // Generate Cycle 2 snapshot
    await PatternIntelligenceService.generatePatternSnapshot(testUserId, cycle2Id);

    // Fetch overview
    const overview2 = await PatternIntelligenceService.getPatternOverview(testUserId);
    assert(overview2.totalCyclesObserved === 2, 'Should observe 2 cycles now');

    const avoidanceCard2 = overview2.patterns.find(p => p.name === 'Avoidance');
    assert(avoidanceCard2?.status === 'present', 'Avoidance status should transit from "new" to "present"');
    assert(avoidanceCard2?.timeline[0] === 'new' && avoidanceCard2?.timeline[1] === 'quiet', 
      `Avoidance timeline should correctly show ['new', 'quiet'] based on frequency thresholds`);

    const fineCard2 = overview2.patterns.find(p => p.name === 'Saying "fine"');
    assert(fineCard2?.status === 'quiet', 'Saying "fine" should now be "quiet" since it has no occurrences in Cycle 2');
    assert(fineCard2?.timeline[0] === 'new' && fineCard2?.timeline[1] === 'absent', 
      `Saying "fine" timeline should be ['new', 'absent']`);

    const conflictCard2 = overview2.patterns.find(p => p.name === 'Conflict aversion');
    assert(conflictCard2?.status === 'new', 'Conflict aversion should be "new" in Cycle 2');
    assert(conflictCard2?.timeline[0] === 'absent' && conflictCard2?.timeline[1] === 'new', 
      `Conflict aversion timeline should be ['absent', 'new']`);

    // Verify Summary Strip
    assert(overview2.summary.present === 1, 'Summary: 1 present pattern');
    assert(overview2.summary.new === 1, 'Summary: 1 new pattern');
    assert(overview2.summary.quiet === 1, 'Summary: 1 gone quiet pattern');

    // 6. Test Details API
    console.log('\n--- Test 4: Pattern Detail Compilation ---');
    const details = await PatternIntelligenceService.getPatternDetail(testUserId, 'Avoidance');
    assert(details !== null, 'Details should be fetched successfully');
    assert(details?.name === 'Avoidance', 'Detail name matches');

    console.log('\n=== All Pattern Engine E2E Verification Tests Passed Successfully! ===\n');

  } finally {
    console.log('Cleaning up registered test user and all cascades...');
    await supabase.from('pattern_snapshots').delete().eq('user_id', testUserId);
    await supabase.from('pattern_extractions').delete().eq('user_id', testUserId);
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
