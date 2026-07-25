import fs from 'fs';
import path from 'path';

// Parse .env file manually at top level
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  for (const line of envConfig.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalsIdx = trimmed.indexOf('=');
      if (equalsIdx > 0) {
        const key = trimmed.slice(0, equalsIdx).trim();
        const value = trimmed.slice(equalsIdx + 1).trim();
        process.env[key] = value;
      }
    }
  }
}

export async function runPipelineV3Tests() {
  const { supabase } = await import('../db');
  const { ExerciseInitializationService } = await import('./exerciseInitializationService');
  const { ExerciseAnalysisWorker } = await import('./exerciseAnalysisWorker');
  const { ExerciseResultService } = await import('./exerciseResultService');

  console.log('===================================================');
  console.log(' AUTOMATED EXERCISE PIPELINE V3 END-TO-END TEST ');
  console.log('===================================================');

  // Fetch valid test user and active cycle
  const { data: cycles } = await supabase
    .from('cycles')
    .select('id, user_id, current_day')
    .eq('status', 'ACTIVE')
    .limit(5);

  let user: any = null;
  let activeCycle: any = null;

  for (const c of cycles || []) {
    const { data: u } = await supabase.from('users').select('id').eq('id', c.user_id).maybeSingle();
    if (u) {
      user = u;
      activeCycle = c;
      break;
    }
  }

  if (!user || !activeCycle) throw new Error('No valid user with active cycle found for test');

  console.log(`\n👤 Test User: ${user.id} | Cycle: ${activeCycle.id} (Day ${activeCycle.current_day})`);

  // Ensure all 4 instances exist and are unlocked for testing
  const instances = await ExerciseInitializationService.syncUserInstances(user.id, activeCycle.id, 14, true);
  console.log(`\n📋 Synced ${instances.length} exercise instances for testing.`);

  // --- TEST EXERCISE 0 ---
  console.log('\n--- 1. TESTING EXERCISE 0 (OCEAN Baseline) ---');
  const inst0 = instances.find(i => i.exercise_id === 'exercise_0');
  if (!inst0) throw new Error('exercise_0 instance missing');

  // Insert mock 16 OCEAN answers
  const oceanAnswers = Array.from({ length: 16 }, (_, i) => ({
    user_id: user.id,
    instance_id: inst0.id,
    question_id: `q${i + 1}`,
    step_id: `step_${i + 1}`,
    response: (i % 5) + 1
  }));

  await supabase.from('exercise_responses').upsert(oceanAnswers, { onConflict: 'user_id,instance_id,question_id' });

  // Run analysis worker inline
  console.log(`  ⚡ Executing Exercise 0 Analysis Worker...`);
  await ExerciseAnalysisWorker.execute({
    instance_id: inst0.id,
    exercise_id: 'exercise_0',
    user_id: user.id,
    cycle_id: activeCycle.id
  });

  const res0Payload = await ExerciseResultService.getResult(user.id, inst0.id);
  const res0 = res0Payload.result;
  console.log(`  ✅ Exercise 0 Result persisted! Summary: "${res0?.summary?.slice(0, 60)}..."`);
  if (!res0 || !res0.analysis) throw new Error('Exercise 0 analysis failed');

  // --- TEST EXERCISE 1 ---
  console.log('\n--- 2. TESTING EXERCISE 1 (Word Association) ---');
  const inst1 = instances.find(i => i.exercise_id === 'exercise_1');
  if (!inst1) throw new Error('exercise_1 instance missing');

  // Insert mock 12 Word Association answers
  const wordAnswers = Array.from({ length: 12 }, (_, i) => ({
    user_id: user.id,
    instance_id: inst1.id,
    question_id: `q_${i + 1}`,
    step_id: `step_${i + 1}`,
    response: `Response for word ${i + 1}`
  }));

  await supabase.from('exercise_responses').upsert(wordAnswers, { onConflict: 'user_id,instance_id,question_id' });

  console.log(`  ⚡ Executing Exercise 1 Analysis Worker...`);
  await ExerciseAnalysisWorker.execute({
    instance_id: inst1.id,
    exercise_id: 'exercise_1',
    user_id: user.id,
    cycle_id: activeCycle.id
  });

  const res1Payload = await ExerciseResultService.getResult(user.id, inst1.id);
  const res1 = res1Payload.result;
  console.log(`  ✅ Exercise 1 Result persisted! Analysis: "${res1?.analysis?.slice(0, 60)}..."`);
  if (!res1 || !res1.analysis) throw new Error('Exercise 1 analysis failed');

  // --- TEST EXERCISE 2 ---
  console.log('\n--- 3. TESTING EXERCISE 2 (Inkblot Projective) ---');
  const inst2 = instances.find(i => i.exercise_id === 'exercise_2');
  if (!inst2) throw new Error('exercise_2 instance missing');

  // Insert mock 5 Inkblot card step responses
  const blotAnswers: any[] = [];
  [1, 2, 3, 4, 5].forEach(cardId => {
    blotAnswers.push({ user_id: user.id, instance_id: inst2.id, question_id: `card_${cardId}_step_1`, step_id: `step_1`, response: `Butterfly shape on card ${cardId}` });
    blotAnswers.push({ user_id: user.id, instance_id: inst2.id, question_id: `card_${cardId}_step_2`, step_id: `step_2`, response: `Center wing pattern on card ${cardId}` });
    blotAnswers.push({ user_id: user.id, instance_id: inst2.id, question_id: `card_${cardId}_step_3`, step_id: `step_3`, response: `Calm, symmetrical feeling on card ${cardId}` });
  });

  await supabase.from('exercise_responses').upsert(blotAnswers, { onConflict: 'user_id,instance_id,question_id' });

  console.log(`  ⚡ Executing Exercise 2 Analysis Worker...`);
  await ExerciseAnalysisWorker.execute({
    instance_id: inst2.id,
    exercise_id: 'exercise_2',
    user_id: user.id,
    cycle_id: activeCycle.id
  });

  const res2Payload = await ExerciseResultService.getResult(user.id, inst2.id);
  const res2 = res2Payload.result;
  console.log(`  ✅ Exercise 2 Result persisted! Analysis: "${res2?.analysis?.slice(0, 60)}..."`);
  if (!res2 || !res2.analysis) throw new Error('Exercise 2 analysis failed');

  // --- TEST EXERCISE 3 ---
  console.log('\n--- 4. TESTING EXERCISE 3 (Self-Perception vs Reality Check) ---');
  const inst3 = instances.find(i => i.exercise_id === 'exercise_3');
  if (!inst3) throw new Error('exercise_3 instance missing');

  // Insert mock 5 free-text answers for Self-Perception
  const cbtAnswers = [
    { user_id: user.id, instance_id: inst3.id, question_id: 'q1', step_id: 'step_1', response: 'When things got hard, I withdrew and stayed alone in my room instead of talking.' },
    { user_id: user.id, instance_id: inst3.id, question_id: 'q2', step_id: 'step_2', response: 'I avoided the tension with my coworker by staying quiet during the meeting.' },
    { user_id: user.id, instance_id: inst3.id, question_id: 'q3', step_id: 'step_3', response: 'I keep meaning to set clearer boundaries about my work hours.' },
    { user_id: user.id, instance_id: inst3.id, question_id: 'q4', step_id: 'step_4', response: 'I prioritised everyone elses needs above my own during the past three weeks.' },
    { user_id: user.id, instance_id: inst3.id, question_id: 'q5', step_id: 'step_5', response: 'I would change my tendency to overthink before acting, but fear of failure stops me.' }
  ];

  await supabase.from('exercise_responses').upsert(cbtAnswers, { onConflict: 'user_id,instance_id,question_id' });

  console.log(`  ⚡ Executing Exercise 3 Analysis Worker (with multi-source context)...`);
  await ExerciseAnalysisWorker.execute({
    instance_id: inst3.id,
    exercise_id: 'exercise_3',
    user_id: user.id,
    cycle_id: activeCycle.id
  });

  const res3Payload = await ExerciseResultService.getResult(user.id, inst3.id);
  const res3 = res3Payload.result;
  console.log(`  ✅ Exercise 3 Result persisted! Analysis: "${res3?.analysis?.slice(0, 60)}..."`);
  if (!res3 || !res3.analysis) throw new Error('Exercise 3 analysis failed');

  console.log('\n===================================================');
  console.log(' 🎉 ALL EXERCISES (0, 1, 2, 3) PIPELINE TESTS PASSED! ');
  console.log('===================================================');
}

runPipelineV3Tests().catch(err => {
  console.error('Pipeline V3 test failed:', err);
  process.exit(1);
});
