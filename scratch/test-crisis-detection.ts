import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim();
      if (key && val) {
        process.env[key.trim()] = val;
      }
    }
    console.log('[Test Setup] Loaded environment variables.');
  }
} catch (err) {
  console.error('[Test Setup] Error loading .env file:', err);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runCrisisTests() {
  console.log('\n==================================================');
  console.log('🧪 CRISIS DETECTION INTEGRATION TESTS');
  console.log('==================================================\n');

  // 1. Fetch test subjects
  const { data: users } = await supabase.from('users').select('*').limit(1);
  const user = users?.[0];
  if (!user) {
    console.error('❌ Error: No user found. Run seeding first.');
    process.exit(1);
  }
  console.log(`Using test user: ${user.name || user.id}`);

  // Fetch a cycle for this user
  let { data: cycles } = await supabase.from('cycles').select('*').eq('user_id', user.id).limit(1);
  let cycle = cycles?.[0];
  if (!cycle) {
    console.log(`No cycle found for user ${user.name}. Creating one...`);
    const { data: newCycle, error: cycleErr } = await supabase
      .from('cycles')
      .insert({
        user_id: user.id,
        number: 1,
        status: 'active',
        started_at: new Date().toISOString().split('T')[0],
        total_days: 30
      })
      .select()
      .single();
    if (cycleErr) {
      console.error('❌ Error creating cycle:', cycleErr.message);
      process.exit(1);
    }
    cycle = newCycle;
  }

  // Import workers dynamically
  const { processEntryScoring } = await import('../src/lib/queue/workers/entryScoringWorker');
  const { processCrisisDetection } = await import('../src/lib/queue/workers/crisisDetectionWorker');
  const { processReflectionGeneration } = await import('../src/lib/queue/workers/reflectionWorker');
  const { processWeeklySummary } = await import('../src/lib/queue/workers/weeklySummaryWorker');

  // ==========================================
  // TEST case 1: Score-based Immediate Crisis
  // EI = 10, SA = 1
  // ==========================================
  console.log('--- TEST 1: Score-based Immediate Crisis (EI >= 9, SA <= 2) ---');
  
  // Insert distressed entry
  const { data: entry1, error: insErr1 } = await supabase
    .from('entries')
    .insert({
      user_id: user.id,
      cycle_id: cycle.id,
      cycle_day: 10,
      content: 'I feel completely overwhelmed. Everything is out of my control and I cannot breathe. There is no agency and maximum distress.',
      new_entry_text_encrypted: 'I feel completely overwhelmed. Everything is out of my control and I cannot breathe. There is no agency and maximum distress.',
      entry_type: 'new_only',
      word_count: 20,
      written_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insErr1 || !entry1) {
    console.error('Failed to create test entry 1:', insErr1?.message);
    process.exit(1);
  }

  console.log(`Created distressed entry ${entry1.id}. Running entryScoringWorker...`);
  
  // We mock processEntryScoring. Since the AI might return different scores for this text, we can verify that the score logic sets crisis flags.
  // Wait, let's run it and see what scores the AI generates, or we can manually update scores to force trigger it if the AI scores slightly lower.
  await processEntryScoring({ entry_id: entry1.id, user_id: user.id });

  // Query entry1 status
  let { data: scoredEntry1 } = await supabase.from('entries').select('*').eq('id', entry1.id).single();
  console.log(`Scores generated: EI = ${scoredEntry1?.day_ei}, SA = ${scoredEntry1?.day_sa}`);
  
  if (scoredEntry1?.day_ei !== null && scoredEntry1?.day_sa !== null && scoredEntry1.day_ei >= 9 && scoredEntry1.day_sa <= 2) {
    console.log(`✅ Immediate crisis condition met. crisis_flag: ${scoredEntry1.crisis_flag}, type: ${scoredEntry1.crisis_type}, suppressed: ${scoredEntry1.reflection_suppressed}`);
  } else {
    console.warn(`⚠️ AI did not score EI >= 9 and SA <= 2. Forcing scores to verify logic...`);
    // Manually force immediate crisis scores and re-run scoring worker logic (simulated by DB update)
    await supabase.from('entries').update({
      day_ei: 9.5,
      day_sa: 1.5,
      scoring_status: 'scored'
    }).eq('id', entry1.id);
    
    // Rerun scoring worker to apply the logic based on these forced scores
    await processEntryScoring({ entry_id: entry1.id, user_id: user.id });
    
    ({ data: scoredEntry1 } = await supabase.from('entries').select('*').eq('id', entry1.id).single());
    console.log(`After forcing scores: crisis_flag: ${scoredEntry1?.crisis_flag}, type: ${scoredEntry1?.crisis_type}, suppressed: ${scoredEntry1?.reflection_suppressed}`);
  }

  // Run crisis detection worker (sets crisis_checked = true)
  console.log(`Running crisisDetectionWorker...`);
  await processCrisisDetection({ entry_id: entry1.id, user_id: user.id });
  
  // Check reflection suppression
  console.log(`Running reflectionWorker...`);
  await processReflectionGeneration({ entry_id: entry1.id, user_id: user.id });

  // Verify reflection row
  const { data: refl1 } = await supabase.from('reflections').select('*').eq('entry_id', entry1.id).maybeSingle();
  console.log(`Reflection generated status: ${refl1?.status}, question: ${refl1?.closing_question}`);
  if (refl1?.status === 'failed' && refl1?.closing_question === null) {
    console.log('✅ Reflection successfully suppressed!');
  } else {
    console.error('❌ Reflection was NOT suppressed.');
  }

  // ==========================================
  // TEST case 2: Risk Language Detected
  // Explicit self-harm statement
  // ==========================================
  console.log('\n--- TEST 2: Risk Language Detection ---');
  const { data: entry2, error: insErr2 } = await supabase
    .from('entries')
    .insert({
      user_id: user.id,
      cycle_id: cycle.id,
      cycle_day: 11,
      content: 'I want to end my life. I want to kill myself.',
      new_entry_text_encrypted: 'I want to end my life. I want to kill myself.',
      entry_type: 'new_only',
      word_count: 10,
      written_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insErr2 || !entry2) {
    console.error('Failed to create test entry 2:', insErr2?.message);
    process.exit(1);
  }

  console.log(`Created risk language entry ${entry2.id}. Running crisisDetectionWorker...`);
  await processCrisisDetection({ entry_id: entry2.id, user_id: user.id });

  const { data: checkedEntry2 } = await supabase.from('entries').select('*').eq('id', entry2.id).single();
  console.log(`Crisis flagged: ${checkedEntry2?.crisis_flag}, Type: ${checkedEntry2?.crisis_type}, Quote: ${checkedEntry2?.risk_language_quote}`);
  
  if (checkedEntry2?.crisis_flag && checkedEntry2?.crisis_type === 'Risk_Language') {
    console.log('✅ Risk language crisis successfully flagged!');
  } else {
    console.error('❌ Risk language crisis was NOT flagged.');
  }

  // Check crisis_log table
  const { data: logs } = await supabase.from('crisis_log').select('*').eq('user_id', user.id).order('timestamp', { ascending: false });
  console.log(`Active user crisis logs:`, logs?.map(l => ({ type: l.crisis_type, time: l.timestamp })));
  if (logs && logs.length > 0) {
    console.log('✅ Crisis events successfully logged to crisis_log table!');
  } else {
    console.error('❌ No logs found in crisis_log table.');
  }

  // ==========================================
  // Clean up test records
  // ==========================================
  console.log('\nCleaning up test records...');
  await supabase.from('entries').delete().in('id', [entry1.id, entry2.id]);
  console.log('Cleanup completed.');

  console.log('\n==================================================');
  console.log('🎉 CRISIS DETECTION INTEGRATION TESTS COMPLETED');
  console.log('==================================================\n');
}

runCrisisTests().catch(err => {
  console.error('Error during crisis tests:', err);
  process.exit(1);
});
