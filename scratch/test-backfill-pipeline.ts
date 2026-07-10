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

async function test() {
  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  const knowledgePath = pathToFileURL(path.join(process.cwd(), 'src/lib/knowledge/knowledgeService.ts')).href;
  const { KnowledgeService } = await import(knowledgePath);

  console.log('=== E2E Backfill Verification Test ===');

  // 1. Create a clean registered user in auth.users
  const email = `test-knowledge-backfill-${crypto.randomUUID()}@example.com`;
  const password = 'TestPassword123!';
  const phone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  console.log(`Registering clean auth user: ${email}`);
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

  console.log('Cleaning up old test records...');
  await db.from('knowledge_backfill_status').delete().eq('user_id', testUserId);
  await db.from('knowledge_cards').delete().eq('user_id', testUserId);
  await db.from('knowledge_snapshots').delete().eq('user_id', testUserId);
  await db.from('knowledge_profile').delete().eq('user_id', testUserId);
  await db.from('knowledge_events').delete().eq('user_id', testUserId);
  
  await db.from('entry_scores').delete().eq('user_id', testUserId);
  await db.from('vocab_extractions').delete().eq('user_id', testUserId);
  await db.from('pattern_snapshots').delete().eq('user_id', testUserId);
  await db.from('weekly_summaries').delete().eq('user_id', testUserId);
  await db.from('entries').delete().eq('user_id', testUserId);
  await db.from('cycles').delete().eq('user_id', testUserId);
  await db.from('profiles').delete().eq('id', testUserId);
  await db.from('users').delete().eq('id', testUserId);

  console.log('Inserting test profile, cycle, entries, vocabulary, and summaries...');
  
  // Insert/upsert public.users
  const { error: userErr } = await db
    .from('users')
    .upsert({
      id: testUserId,
      phone_number: phone,
      name: 'Verification Test User'
    });
  if (userErr) {
    await db.auth.admin.deleteUser(testUserId);
    throw new Error(`UserErr: ${userErr.message}`);
  }

  // Insert/upsert profile
  const { error: profErr } = await db
    .from('profiles')
    .upsert({
      id: testUserId,
      full_name: 'Verification Test User',
      phone_number: phone
    });
  if (profErr) {
    await db.auth.admin.deleteUser(testUserId);
    throw new Error(`ProfErr: ${profErr.message}`);
  }

  // Insert cycle
  const { error: cycleErr } = await db
    .from('cycles')
    .insert({
      id: testCycleId,
      user_id: testUserId,
      cycle_number: 1,
      start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    });
  if (cycleErr) throw new Error(`CycleErr: ${cycleErr.message}`);

  // Insert entries
  const { data: testEntries, error: entryErr } = await db
    .from('entries')
    .insert([
      {
        user_id: testUserId,
        cycle_id: testCycleId,
        cycle_day: 1,
        content: 'I feel stressed about my work and deadlines.',
        word_count: 10,
        vocab_processed: true
      },
      {
        user_id: testUserId,
        cycle_id: testCycleId,
        cycle_day: 2,
        content: 'I am anxious about my choices and relationships.',
        word_count: 10,
        vocab_processed: true
      }
    ])
    .select();
  if (entryErr) throw new Error(`EntryErr: ${entryErr.message}`);

  // Insert entry scores
  await db.from('entry_scores').insert(
    testEntries.map(e => ({
      user_id: testUserId,
      entry_id: e.id,
      day_ei: 4,
      day_pr: 5,
      day_sa: 6
    }))
  );

  // Insert weekly summary
  const { error: wsErr } = await db
    .from('weekly_summaries')
    .insert({
      user_id: testUserId,
      cycle_id: testCycleId,
      week_number: 1,
      day_start: 1,
      day_end: 7,
      title: 'Week 1 Synthesis',
      why: 'I am moving from anxiety to structured grounding.',
      body: 'During this week, I wrote two entries highlighting stress management.',
      status: 'READY',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  if (wsErr) throw new Error(`WsErr: ${wsErr.message}`);

  // Insert vocab extractions
  await db.from('vocab_extractions').insert([
    {
      user_id: testUserId,
      cycle_id: testCycleId,
      entry_id: testEntries[0].id,
      word: 'stress',
      normalized_word: 'stress',
      sentence: 'I am feeling high work stress.',
      confidence: 1.0
    },
    {
      user_id: testUserId,
      cycle_id: testCycleId,
      entry_id: testEntries[1].id,
      word: 'anxiety',
      normalized_word: 'anxiety',
      sentence: 'I am anxious about my choices.',
      confidence: 0.95
    }
  ]);

  // Insert pattern snapshot
  const { error: patErr } = await db
    .from('pattern_snapshots')
    .insert({
      user_id: testUserId,
      cycle_id: testCycleId,
      cycle_number: 1,
      snapshot_status: 'completed',
      snapshot_data: {
        patterns: [
          {
            name: 'Boundary building',
            status: 'new',
            summary: 'Active effort to define and defend personal space.',
            why_it_matters: 'Essential for cognitive reframing.'
          }
        ]
      },
      updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    });
  if (patErr) throw new Error(`PatErr: ${patErr.message}`);

  // 2. Run Backfill: Verification 1 (First Run)
  console.log('\nRunning historical backfill (First Run)...');
  const status1 = await KnowledgeService.backfillUser(testUserId, false);
  console.log(`First Run Complete. Status:`, status1.status);
  
  if (status1.status !== 'completed') {
    throw new Error(`Expected completed status, got ${status1.status}`);
  }

  // Count events and check profile
  const { count: eventsCount } = await db
    .from('knowledge_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', testUserId);
  console.log(`Emitted knowledge events: ${eventsCount}`);
  if (!eventsCount || eventsCount === 0) {
    throw new Error('No knowledge events emitted.');
  }

  const { data: profile } = await db
    .from('knowledge_profile')
    .select('*')
    .eq('user_id', testUserId)
    .single();
  console.log('Generated identity narrative:', profile.identity_model.core_narrative);
  console.log('Emotion triggers:', profile.emotion_model.triggers);

  const { count: cardsCount } = await db
    .from('knowledge_cards')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', testUserId);
  console.log(`Generated knowledge cards: ${cardsCount}`);
  if (!cardsCount || cardsCount === 0) {
    throw new Error('No knowledge cards generated.');
  }

  // 3. Verification 2 (Second Run - Idempotency and Resumability)
  console.log('\nRunning historical backfill (Second Run without force)...');
  const startTime = Date.now();
  const status2 = await KnowledgeService.backfillUser(testUserId, false);
  const duration = Date.now() - startTime;
  console.log(`Second Run Complete in ${duration}ms. Status:`, status2.status);
  
  if (duration > 1000) {
    throw new Error('Second run took too long; it should have returned immediately.');
  }

  // 4. Verification 3 (Resume/Interruption Test)
  console.log('\nSimulating interrupted backfill...');
  // Force delete cards and profile, but keep events
  await db.from('knowledge_cards').delete().eq('user_id', testUserId);
  await db.from('knowledge_profile').delete().eq('user_id', testUserId);
  
  // Set backfill status back to processing
  await db.from('knowledge_backfill_status').update({
    status: 'processing',
    current_step: 'processing_events'
  }).eq('user_id', testUserId);

  // Set one event as unprocessed
  const { data: eventsList } = await db
    .from('knowledge_events')
    .select('id')
    .eq('user_id', testUserId)
    .limit(1);
  const targetEventId = eventsList[0].id;
  await db.from('knowledge_events').update({ processed: false }).eq('id', targetEventId);

  console.log(`Running backfill again (Resume Run)...`);
  const statusResume = await KnowledgeService.backfillUser(testUserId, false);
  console.log('Resume Run Complete. Status:', statusResume.status);

  // Check that all events are now processed
  const { count: unprocessedCount } = await db
    .from('knowledge_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', testUserId)
    .eq('processed', false);
  console.log(`Unprocessed events remaining: ${unprocessedCount}`);
  if (unprocessedCount !== 0) {
    throw new Error(`Expected 0 unprocessed events, got ${unprocessedCount}`);
  }

  // Check profile regenerated
  const { count: finalProfileExists } = await db
    .from('knowledge_profile')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', testUserId);
  if (!finalProfileExists || finalProfileExists === 0) {
    throw new Error('Profile was not regenerated on resume.');
  }

  // 5. Cleanup test user data completely
  console.log('\nCleaning up all test user data...');
  await db.from('knowledge_backfill_status').delete().eq('user_id', testUserId);
  await db.from('knowledge_cards').delete().eq('user_id', testUserId);
  await db.from('knowledge_snapshots').delete().eq('user_id', testUserId);
  await db.from('knowledge_profile').delete().eq('user_id', testUserId);
  await db.from('knowledge_events').delete().eq('user_id', testUserId);
  
  await db.from('entry_scores').delete().eq('user_id', testUserId);
  await db.from('vocab_extractions').delete().eq('user_id', testUserId);
  await db.from('pattern_snapshots').delete().eq('user_id', testUserId);
  await db.from('weekly_summaries').delete().eq('user_id', testUserId);
  await db.from('entries').delete().eq('user_id', testUserId);
  await db.from('cycles').delete().eq('user_id', testUserId);
  await db.from('profiles').delete().eq('id', testUserId);
  await db.from('users').delete().eq('id', testUserId);
  await db.auth.admin.deleteUser(testUserId);

  console.log('\n=== E2E Backfill Verification Test PASSED! ===');
}

test().catch(err => {
  console.error('\n=== E2E Backfill Verification Test FAILED! ===');
  console.error(err);
  process.exit(1);
});
