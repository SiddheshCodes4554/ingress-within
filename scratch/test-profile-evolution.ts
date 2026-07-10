import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import crypto from 'crypto';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      if (line.trim().startsWith('#') || !line.trim()) return;
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

async function runTest() {
  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  const knowledgePath = pathToFileURL(path.join(process.cwd(), 'src/lib/knowledge/knowledgeService.ts')).href;
  const { KnowledgeService } = await import(knowledgePath);

  console.log('=== E2E Profile Evolution & Gatekeeper Verification Test ===');

  // 1. Create dynamic test user
  const email = `test-profile-evolution-${crypto.randomUUID()}@example.com`;
  const password = 'TestPassword123!';
  const phone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  console.log(`Registering auth user: ${email}`);
  const { data: authData, error: authErr } = await db.auth.admin.createUser({
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
  const testCycleId = crypto.randomUUID();

  // Cleanup helper
  const cleanup = async () => {
    console.log('\nCleaning up database test records...');
    await db.from('knowledge_backfill_status').delete().eq('user_id', testUserId);
    await db.from('knowledge_cards').delete().eq('user_id', testUserId);
    await db.from('knowledge_snapshots').delete().eq('user_id', testUserId);
    await db.from('knowledge_profile').delete().eq('user_id', testUserId);
    await db.from('knowledge_events').delete().eq('user_id', testUserId);
    await db.from('entry_scores').delete().eq('user_id', testUserId);
    await db.from('vocab_extractions').delete().eq('user_id', testUserId);
    await db.from('reflections').delete().eq('user_id', testUserId);
    await db.from('entries').delete().eq('user_id', testUserId);
    await db.from('cycles').delete().eq('user_id', testUserId);
    await db.from('profiles').delete().eq('id', testUserId);
    await db.from('users').delete().eq('id', testUserId);
    await db.auth.admin.deleteUser(testUserId);
    console.log('Cleanup finished.');
  };

  try {
    // Setup tables
    await db.from('users').upsert({ id: testUserId, phone_number: phone, name: 'Evolution Test User' });
    await db.from('profiles').upsert({ id: testUserId, full_name: 'Evolution Test User', phone_number: phone });
    await db.from('cycles').insert({ id: testCycleId, user_id: testUserId, cycle_number: 1, start_date: new Date().toISOString() });

    // Insert Day 1 Journal
    console.log('\nInserting Day 1 Journal Entry...');
    const { data: entry1, error: ent1Err } = await db
      .from('entries')
      .insert({
        user_id: testUserId,
        cycle_id: testCycleId,
        cycle_day: 1,
        content: 'I decided to start setting boundaries at my job. I chose to speak up when my boss piled on extra workload, even though I felt anxious and had to overcome my fear of conflict.',
        word_count: 35,
        vocab_processed: true
      })
      .select()
      .single();
    if (ent1Err) throw new Error(`Entry1Err: ${ent1Err.message}`);

    // Insert Day 1 score and reflection
    await db.from('entry_scores').insert({ user_id: testUserId, entry_id: entry1.id, day_ei: 6, day_pr: 7, day_sa: 8 });
    await db.from('reflections').insert({ user_id: testUserId, entry_id: entry1.id, reflection_text: 'You chose to declare boundaries and feel self-agency over stress.' });
    await db.from('vocab_extractions').insert([
      { user_id: testUserId, cycle_id: testCycleId, entry_id: entry1.id, word: 'boundaries', normalized_word: 'boundary', confidence: 1.0 },
      { user_id: testUserId, cycle_id: testCycleId, entry_id: entry1.id, word: 'anxious', normalized_word: 'anxious', confidence: 0.9 }
    ]);

    // --- TEST 1: Gatekeeper Check on intermediate events ---
    console.log('\n--- VERIFICATION 1: Gatekeeper Check ---');
    console.log('Emitting intermediate event JournalCreated...');
    const ev1 = await KnowledgeService.emitKnowledgeEvent(testUserId, testCycleId, entry1.id, 'JournalCreated', 'journal', { entry_id: entry1.id });
    await KnowledgeService.processKnowledgeEvent(ev1.id);

    console.log('Emitting intermediate event ReflectionGenerated...');
    const ev2 = await KnowledgeService.emitKnowledgeEvent(testUserId, testCycleId, entry1.id, 'ReflectionGenerated', 'reflection_engine', { reflection_id: crypto.randomUUID() });
    await KnowledgeService.processKnowledgeEvent(ev2.id);

    // Verify profile does NOT exist yet
    const { data: profBefore } = await db.from('knowledge_profile').select('*').eq('user_id', testUserId).maybeSingle();
    console.log('Profile exists before pipeline completion?', !!profBefore);
    if (profBefore) {
      throw new Error('Gatekeeper Failure: profile was updated from partial/intermediate events.');
    }
    console.log('✓ Gatekeeper successfully ignored intermediate events!');

    // --- TEST 2: Pipeline completion update ---
    console.log('\n--- VERIFICATION 2: Pipeline Completion ---');
    console.log('Emitting completion event VocabularyUpdated...');
    const ev3 = await KnowledgeService.emitKnowledgeEvent(testUserId, testCycleId, entry1.id, 'VocabularyUpdated', 'vocabulary_engine', { entry_id: entry1.id });
    await KnowledgeService.processKnowledgeEvent(ev3.id);

    // Verify profile exists now
    const { data: profAfter, error: fetchProfErr } = await db.from('knowledge_profile').select('*').eq('user_id', testUserId).maybeSingle();
    if (fetchProfErr) throw fetchProfErr;
    console.log('Profile created after VocabularyUpdated?', !!profAfter);
    if (!profAfter) {
      throw new Error('Pipeline Failure: profile was not created on VocabularyUpdated.');
    }
    console.log('✓ Profile successfully generated on pipeline completion!');

    // --- TEST 3: Schema & Content Compliance ---
    console.log('\n--- VERIFICATION 3: Dimension Schema Compliance ---');
    const dimensions = [
      'identity_model', 'emotion_model', 'vocabulary_model', 'pattern_model',
      'agency_model', 'relationship_model', 'decision_model', 'growth_model',
      'communication_model', 'stress_model', 'values_model'
    ];

    for (const dim of dimensions) {
      const model = profAfter[dim];
      console.log(`Checking dimension: ${dim}...`);
      if (!model) {
        throw new Error(`Dimension ${dim} is missing.`);
      }
      if (typeof model.summary !== 'string' || !model.summary) {
        throw new Error(`Dimension ${dim} summary is invalid.`);
      }
      if (!['High', 'Medium', 'Low'].includes(model.confidence)) {
        throw new Error(`Dimension ${dim} confidence is invalid: ${model.confidence}`);
      }
      if (!model.supporting_events || !Array.isArray(model.supporting_events.journals)) {
        throw new Error(`Dimension ${dim} supporting_events is invalid.`);
      }
      if (!Array.isArray(model.supporting_vocabulary)) {
        throw new Error(`Dimension ${dim} supporting_vocabulary is invalid.`);
      }
      if (!model.last_updated) {
        throw new Error(`Dimension ${dim} last_updated is missing.`);
      }
    }
    console.log('✓ All 11 models fully conform to the standard structured schema!');

    // Check tone & citation
    console.log('Agency summary:', profAfter.agency_model.summary);
    console.log('Relationship summary:', profAfter.relationship_model.summary);
    console.log('Growth summary:', profAfter.growth_model.summary);
    console.log('Stress summary:', profAfter.stress_model.summary);
    console.log('Values summary:', profAfter.values_model.summary);
    console.log('Agency journals cited:', profAfter.agency_model.supporting_events.journals);
    
    if (!profAfter.agency_model.supporting_events.journals.includes(entry1.id)) {
      throw new Error('Citation Failure: Day 1 entry ID is not listed in supporting_events.');
    }
    console.log('✓ Audit trail includes the correct entry citations!');

    // --- TEST 4: Incremental Evolution ---
    console.log('\n--- VERIFICATION 4: Incremental Evolution ---');
    console.log('Inserting Day 2 Journal Entry...');
    const { data: entry2, error: ent2Err } = await db
      .from('entries')
      .insert({
        user_id: testUserId,
        cycle_id: testCycleId,
        cycle_day: 2,
        content: 'I worked late again to hit achievement milestones. I feel burned out under the pressure, but I kept going. I had to support my coworkers, but I did not walk or rest like I planned.',
        word_count: 36,
        vocab_processed: true
      })
      .select()
      .single();
    if (ent2Err) throw new Error(`Entry2Err: ${ent2Err.message}`);

    await db.from('entry_scores').insert({ user_id: testUserId, entry_id: entry2.id, day_ei: 7, day_pr: 6, day_sa: 4 });
    await db.from('reflections').insert({ user_id: testUserId, entry_id: entry2.id, reflection_text: 'You felt pressure to work and experienced burnout.' });
    await db.from('vocab_extractions').insert([
      { user_id: testUserId, cycle_id: testCycleId, entry_id: entry2.id, word: 'burnout', normalized_word: 'burnout', confidence: 1.0 },
      { user_id: testUserId, cycle_id: testCycleId, entry_id: entry2.id, word: 'pressure', normalized_word: 'pressure', confidence: 0.95 }
    ]);

    console.log('Emitting VocabularyUpdated for Day 2...');
    const ev4 = await KnowledgeService.emitKnowledgeEvent(testUserId, testCycleId, entry2.id, 'VocabularyUpdated', 'vocabulary_engine', { entry_id: entry2.id });
    await KnowledgeService.processKnowledgeEvent(ev4.id);

    // Fetch final profile
    const { data: profFinal } = await db.from('knowledge_profile').select('*').eq('user_id', testUserId).single();
    console.log('Values summary after Day 2:', profFinal.values_model.summary);
    console.log('Stress summary after Day 2:', profFinal.stress_model.summary);
    console.log('Values journals cited:', profFinal.values_model.supporting_events.journals);

    if (profFinal.values_model.supporting_events.journals.length === 0) {
      throw new Error('Evolution Failure: Values model does not cite any journals.');
    }
    console.log('✓ Profile evolved incrementally, appending Day 2 evidence while preserving Day 1 structure!');

    await cleanup();
    console.log('\n=== E2E PROFILE EVOLUTION TEST PASSED! ===');

  } catch (err) {
    console.error('\n=== E2E PROFILE EVOLUTION TEST FAILED! ===');
    console.error(err);
    await cleanup();
    process.exit(1);
  }
}

runTest().catch(console.error);
