import fs from 'fs';
import path from 'path';

// Load environment variables synchronously before dynamic imports
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  });
}

const TEST_USER_ID = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
const TEST_CYCLE_ID = '69d4b73b-f212-47be-a2d4-5ab965e12829';

async function runTest() {
  const { supabase } = await import('../src/lib/db');
  const { ExerciseUnlockService } = await import('../src/lib/exercises/exerciseUnlockService');
  const { ExerciseProgressService } = await import('../src/lib/exercises/exerciseProgressService');
  const { ExerciseAnalysisWorker } = await import('../src/lib/exercises/exerciseAnalysisWorker');
  console.log('=== TESTING EXERCISE 2 (INKBLOT PROJECTIVE ASSESSMENT) ===');

  try {
    // 1. Cleanup old test-only records
    await supabase.from('exercise_results').delete().eq('instance_id', 'inst-test-ex2');
    await supabase.from('exercise_responses').delete().eq('instance_id', 'inst-test-ex2');
    await supabase.from('exercise_instances').delete().eq('user_id', TEST_USER_ID).eq('exercise_id', 'exercise_2');
    await supabase.from('exercise_instances').delete().in('id', ['inst-test-ex0', 'inst-test-ex1', 'inst-test-ex2']);

    // Ensure ex0 and ex1 exist as finished in exercise_instances
    await supabase.from('exercise_instances').upsert([
      {
        id: 'inst-test-ex0',
        user_id: TEST_USER_ID,
        cycle_id: TEST_CYCLE_ID,
        exercise_id: 'exercise_0',
        status: 'finished',
        locked: false,
        available: true,
        started: true,
        completed: true,
        unlock_time: new Date().toISOString()
      },
      {
        id: 'inst-test-ex1',
        user_id: TEST_USER_ID,
        cycle_id: TEST_CYCLE_ID,
        exercise_id: 'exercise_1',
        status: 'finished',
        locked: false,
        available: true,
        started: true,
        completed: true,
        unlock_time: new Date().toISOString()
      }
    ], { onConflict: 'id' });

    // Also update any existing exercise_0 or exercise_1 instances to finished for test duration
    await supabase.from('exercise_instances')
      .update({ status: 'finished', completed: true })
      .eq('user_id', TEST_USER_ID)
      .in('exercise_id', ['exercise_0', 'exercise_1']);

    // Setup 15 dummy entries so entry count check passes
    const entries = Array.from({ length: 15 }, (_, i) => ({
      id: `entry-test-ex2-${i}`,
      user_id: TEST_USER_ID,
      cycle_id: TEST_CYCLE_ID,
      cycle_day: i + 1,
      content: `Test entry content for day ${i + 1}`,
      word_count: 50,
      status: 'analyzed'
    }));
    await supabase.from('entries').upsert(entries);

    // 3. Test Unlock Service
    console.log('[Test 1] Testing Unlock Service for Exercise 2...');
    await ExerciseUnlockService.processUnlocks(TEST_USER_ID, TEST_CYCLE_ID, 'UTC', 15);

    const { data: unlockedInst } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('user_id', TEST_USER_ID)
      .eq('exercise_id', 'exercise_2')
      .maybeSingle();

    if (!unlockedInst) {
      throw new Error('Exercise 2 failed to unlock!');
    }
    console.log('✔ Exercise 2 unlocked successfully:', unlockedInst.id);

    // 4. Test Resume & Inkblot Generator
    console.log('[Test 2] Testing Resume and Inkblot Image Generation...');
    const resumeRes = await ExerciseProgressService.resumeExercise(TEST_USER_ID, unlockedInst.id);

    if (!resumeRes.stimulusList || resumeRes.stimulusList.length !== 5) {
      throw new Error('Resume failed to produce 5 Inkblot image URLs!');
    }
    console.log('✔ Resume produced 5 inkblot SVG data URLs successfully.');

    // 5. Submit responses for all 15 steps (5 cards x 3 steps)
    console.log('[Test 3] Submitting 15 step responses...');
    const responsesToSave = [
      // Card 1
      { q: 'card_1_step_1', val: 'Two dancing figures with wings spreading outwards' },
      { q: 'card_1_step_2', val: 'The top curved wings caught my eye first' },
      { q: 'card_1_step_3', val: 'A sense of rhythm and lightness' },
      // Card 2
      { q: 'card_2_step_1', val: 'A split gate or two standing pillars in motion' },
      { q: 'card_2_step_2', val: 'The empty gap right down the middle' },
      { q: 'card_2_step_3', val: 'Quiet observation' },
      // Card 3
      { q: 'card_3_step_1', val: 'An exploding core with intense crimson highlights' },
      { q: 'card_3_step_2', val: 'The red central accent mark' },
      { q: 'card_3_step_3', val: 'Surprise and sudden focus' },
      // Card 4
      { q: 'card_4_step_1', val: 'A heavy mantle or dark wide structure resting on a plane' },
      { q: 'card_4_step_2', val: 'The wide horizontal base' },
      { q: 'card_4_step_3', val: 'Weight and grounded authority' },
      // Card 5
      { q: 'card_5_step_1', val: 'A tall central spine reaching upwards with soft edges' },
      { q: 'card_5_step_2', val: 'The vertical column rising' },
      { q: 'card_5_step_3', val: 'Calm resolution' }
    ];

    for (let idx = 0; idx < responsesToSave.length; idx++) {
      const item = responsesToSave[idx];
      await supabase.from('exercise_responses').upsert({
        instance_id: unlockedInst.id,
        user_id: TEST_USER_ID,
        question_id: item.q,
        step_id: `step_${idx + 1}`,
        response: item.val,
        created_at: new Date().toISOString()
      }, { onConflict: 'instance_id,question_id' });
    }

    console.log('✔ 15 step responses saved to database.');

    // Mark instance completed
    await supabase.from('exercise_instances').update({
      status: 'completed',
      completed: true
    }).eq('id', unlockedInst.id);

    // 6. Test Worker Execution
    console.log('[Test 4] Executing ExerciseAnalysisWorker for Exercise 2...');
    await ExerciseAnalysisWorker.execute({
      instance_id: unlockedInst.id,
      exercise_id: 'exercise_2',
      user_id: TEST_USER_ID,
      cycle_id: TEST_CYCLE_ID
    });

    // 7. Verify Results in DB
    console.log('[Test 5] Verifying Exercise Result...');
    const { data: resultRec } = await supabase
      .from('exercise_results')
      .select('*')
      .eq('instance_id', unlockedInst.id)
      .maybeSingle();

    if (!resultRec) {
      throw new Error('Exercise result record not created in exercise_results!');
    }

    console.log('✔ Exercise 2 Result fetched:');
    console.log('   - Analysis text:', resultRec.analysis?.slice(0, 100) + '...');
    console.log('   - Provider/Model:', resultRec.provider, resultRec.model);
    console.log('   - Structured JSON:', resultRec.raw_json);

    if (!resultRec.analysis) {
      throw new Error('Missing prose analysis text in exercise_results!');
    }

    // Clean up test data
    console.log('[Test 6] Cleaning up test data...');
    await supabase.from('exercise_results').delete().eq('instance_id', unlockedInst.id);
    await supabase.from('exercise_responses').delete().eq('instance_id', unlockedInst.id);
    await supabase.from('exercise_instances').delete().in('id', [unlockedInst.id, 'inst-test-ex0', 'inst-test-ex1']);
    await supabase.from('entries').delete().filter('id', 'like', 'entry-test-ex2-%');

    console.log('✅ ALL EXERCISE 2 TESTS PASSED PERFECTLY!');
  } catch (err: any) {
    console.error('❌ EXERCISE 2 TEST FAILED:', err.message, err.stack);
    process.exit(1);
  }
}

runTest();
