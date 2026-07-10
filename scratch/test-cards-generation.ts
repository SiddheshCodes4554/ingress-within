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

  console.log('=== E2E Knowledge Cards Generation & Quality Gate verification ===');

  // 1. Create transient test user
  const email = `test-cards-generation-${crypto.randomUUID()}@example.com`;
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

  // Cleanup helper
  const cleanup = async () => {
    console.log('\nCleaning up database test records...');
    await db.from('knowledge_cards').delete().eq('user_id', testUserId);
    await db.from('knowledge_profile').delete().eq('user_id', testUserId);
    await db.from('profiles').delete().eq('id', testUserId);
    await db.from('users').delete().eq('id', testUserId);
    await db.auth.admin.deleteUser(testUserId);
    console.log('Cleanup finished.');
  };

  try {
    // Setup tables
    await db.from('users').upsert({ id: testUserId, phone_number: phone, name: 'Cards Test User' });
    await db.from('profiles').upsert({ id: testUserId, full_name: 'Cards Test User', phone_number: phone });

    // Mock journal, report, and pattern UUIDs
    const mockJournalId = crypto.randomUUID();
    const mockReportId = crypto.randomUUID();
    const mockPatternId = crypto.randomUUID();

    const createDimension = (summary: string, confidence: 'High' | 'Medium' | 'Low', journals: string[] = [], reports: string[] = [], patterns: string[] = [], vocab: string[] = []) => ({
      summary,
      confidence,
      supporting_events: { journals, reports, patterns },
      supporting_vocabulary: vocab,
      last_updated: new Date().toISOString()
    });

    // Setup active mock profile (with high/medium indicators on growth, values, and relationships, and low on identity)
    const mockProfile = {
      user_id: testUserId,
      identity_model: createDimension('You describe yourself as a writer.', 'Low'),
      emotion_model: createDimension('No observations.', 'Low'),
      vocabulary_model: createDimension('No observations.', 'Low'),
      pattern_model: createDimension('No observations.', 'Low'),
      agency_model: createDimension('No observations.', 'Low'),
      relationship_model: createDimension('You seek support from trusted mentors.', 'Medium', [mockJournalId], [], [], ['mentor', 'support']),
      decision_model: createDimension('No observations.', 'Low'),
      growth_model: createDimension('You are choosing to set professional boundaries and experiencing higher self-agency.', 'High', [mockJournalId], [mockReportId], [mockPatternId], ['boundaries', 'agency']),
      communication_model: createDimension('No observations.', 'Low'),
      stress_model: createDimension('No observations.', 'Low'),
      values_model: createDimension('You value setting personal boundaries to protect your mental health.', 'High', [mockJournalId], [], [], ['boundaries', 'health']),
      knowledge_version: '2.0',
      updated_at: new Date().toISOString()
    };

    await db.from('knowledge_profile').upsert(mockProfile);

    // --- TEST 1: standard card generation & schema compliance ---
    console.log('\n--- VERIFICATION 1: Generate cards from profile ---');
    // We call the private method by casting to any
    await (KnowledgeService as any).generateCardsWithAI(testUserId, mockProfile);

    // Verify written cards
    const { data: dbCards, error: getCardsErr } = await db
      .from('knowledge_cards')
      .select('*')
      .eq('user_id', testUserId);

    if (getCardsErr) throw getCardsErr;
    console.log(`Generated ${dbCards.length} cards.`);
    if (dbCards.length === 0) {
      throw new Error('Failure: No knowledge cards were created.');
    }

    dbCards.forEach((c: any) => {
      console.log(`\nCard type: ${c.card_type}`);
      console.log(`  Title: ${c.title}`);
      console.log(`  Subtitle: ${c.subtitle}`);
      console.log(`  Body: ${c.body}`);
      console.log(`  Confidence: ${c.confidence}`);
      console.log(`  Citations: journals=${c.supporting_entries?.length}, reports=${c.supporting_reports?.length}, patterns=${c.supporting_patterns?.length}`);
      console.log(`  Vocabulary cited:`, c.supporting_vocabulary);

      // Verify schema constraints
      if (!c.title || !c.body) {
        throw new Error('Schema Failure: title or body is empty.');
      }
      if (!['High', 'Medium'].includes(c.confidence)) {
        throw new Error(`Schema Failure: confidence is invalid: ${c.confidence}`);
      }
      if (!Array.isArray(c.supporting_entries) || !Array.isArray(c.supporting_reports) || !Array.isArray(c.supporting_patterns) || !Array.isArray(c.supporting_vocabulary)) {
        throw new Error('Schema Failure: supporting evidence fields must be arrays.');
      }
      
      // Verify gatekeeper: 'identity' dimension was Low confidence, so no identity card should be created!
      if (c.card_type === 'identity' || c.confidence === 'Low') {
        throw new Error('Gatekeeper Failure: Low confidence dimension generated a card.');
      }
    });
    console.log('✓ Cards successfully generated and fully comply with schema and quality gates!');

    // --- TEST 2: duplicate suppression ---
    console.log('\n--- VERIFICATION 2: Duplicate suppression on update ---');
    const oldCardCount = dbCards.length;
    // Re-run card generation
    await (KnowledgeService as any).generateCardsWithAI(testUserId, mockProfile);
    
    const { data: newDbCards } = await db.from('knowledge_cards').select('*').eq('user_id', testUserId);
    console.log(`Cards count after second run: ${newDbCards?.length}`);
    if (newDbCards?.length !== oldCardCount) {
      throw new Error('Suppression Failure: Duplicate cards were created for the same user.');
    }
    console.log('✓ Cards updated successfully without creating duplicate entries!');

    // --- TEST 3: empty state (all Low confidence dimensions) ---
    console.log('\n--- VERIFICATION 3: Empty State Gatekeeper ---');
    const emptyProfile = {
      ...mockProfile,
      relationship_model: createDimension('Low confidence detail', 'Low'),
      growth_model: createDimension('Low confidence detail', 'Low'),
      values_model: createDimension('Low confidence detail', 'Low')
    };

    await db.from('knowledge_profile').upsert(emptyProfile);
    await (KnowledgeService as any).generateCardsWithAI(testUserId, emptyProfile);

    const { data: finalCards } = await db.from('knowledge_cards').select('*').eq('user_id', testUserId);
    console.log(`Cards count for low-evidence profile: ${finalCards?.length}`);
    if (finalCards && finalCards.length > 0) {
      throw new Error('Gatekeeper Failure: generated cards for a low-evidence profile.');
    }
    console.log('✓ Empty state verified! Returned 0 cards when insufficient evidence exists.');

    await cleanup();
    console.log('\n=== E2E KNOWLEDGE CARDS GENERATION TEST PASSED! ===');

  } catch (err) {
    console.error('\n=== E2E KNOWLEDGE CARDS GENERATION TEST FAILED! ===');
    console.error(err);
    await cleanup();
    process.exit(1);
  }
}

runTest().catch(console.error);
