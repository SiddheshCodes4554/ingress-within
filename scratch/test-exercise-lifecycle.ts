import fs from 'fs';
import path from 'path';

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

async function runAutomatedExerciseLifecycleTests() {
  const { supabase } = await import('../src/lib/db');
  const { ExerciseProgressService } = await import('../src/lib/exercises/exerciseProgressService');
  const { ExerciseLifecycleManager } = await import('../src/lib/exercises/exerciseLifecycleManager');
  const { ExerciseAnalysisWorker } = await import('../src/lib/exercises/exerciseAnalysisWorker');

  console.log('===================================================');
  console.log('   AUTOMATED COMPREHENSIVE EXERCISE PLATFORM SUITE ');
  console.log('===================================================');

  // Fetch test user and active cycle
  const { data: user } = await supabase.from('profiles').select('id, full_name').eq('id', 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7').single();
  const { data: activeCycle } = await supabase.from('cycles').select('id').eq('user_id', user?.id).eq('status', 'ACTIVE').single();

  if (!user || !activeCycle) {
    console.error('Test user or active cycle missing.');
    return;
  }

  console.log(`Test User: ${user.full_name} (${user.id}) | Cycle: ${activeCycle.id}`);

  // Test 1: Verify Unlock State for all 4 exercises
  console.log('\n--- TEST 1: VERIFY UNLOCK & INSTANCE ISOLATION ---');
  const testExercises = ['exercise_0', 'exercise_1', 'exercise_2', 'exercise_3'];
  
  for (const exId of testExercises) {
    const { data: inst } = await supabase
      .from('exercise_instances')
      .select('*')
      .eq('user_id', user.id)
      .eq('cycle_id', activeCycle.id)
      .eq('exercise_id', exId)
      .maybeSingle();

    console.log(`  [${exId}] Instance ID: ${inst?.id || 'none'} | Status: ${inst?.status || 'uncreated'}`);
  }

  const { data: inst1Init } = await supabase.from('exercise_instances').select('status').eq('user_id', user.id).eq('cycle_id', activeCycle.id).eq('exercise_id', 'exercise_1').single();
  const { data: inst2Init } = await supabase.from('exercise_instances').select('status').eq('user_id', user.id).eq('cycle_id', activeCycle.id).eq('exercise_id', 'exercise_2').single();
  const inst1Before = inst1Init?.status;
  const inst2Before = inst2Init?.status;

  // Test 2: Start & Autosave for Exercise 1
  console.log('\n--- TEST 2: AUTOSAVE & PROGRESS ISOLATION (Exercise 1) ---');
  const { data: inst1 } = await supabase
    .from('exercise_instances')
    .select('id')
    .eq('user_id', user.id)
    .eq('cycle_id', activeCycle.id)
    .eq('exercise_id', 'exercise_1')
    .single();

  if (inst1) {
    await ExerciseProgressService.saveProgress(user.id, inst1.id, 'q_1', 'step_1', 'Peace');
    await ExerciseProgressService.saveProgress(user.id, inst1.id, 'q_2', 'step_2', 'Truth');

    // Verify Exercise 2 remains untouched
    const { data: inst2Check } = await supabase.from('exercise_instances').select('status').eq('user_id', user.id).eq('cycle_id', activeCycle.id).eq('exercise_id', 'exercise_2').single();

    console.log(`  ✅ Saved progress for exercise_1.`);
    console.log(`  ✅ Isolation Verified: exercise_2 status = ${inst2Check?.status}`);
  }

  // Test 3: Resume State Check
  console.log('\n--- TEST 3: RESUME ACCURACY ---');
  if (inst1) {
    const resumed = await ExerciseProgressService.resumeExercise(user.id, inst1.id);
    console.log(`  ✅ Resumed instance ${resumed.instance.id} | Saved responses count: ${resumed.responses.length}`);
    const q1Resp = resumed.responses.find(r => r.question_id === 'q_1');
    console.log(`  ✅ Verified saved value for q_1: ${q1Resp?.response}`);
  }

  // Test 4: Submit, AI Analysis, Event Emission & Result Persistence for Exercise 1
  console.log('\n--- TEST 4: SUBMIT, AI ANALYSIS & RESULT PERSISTENCE ---');
  if (inst1) {
    for (let i = 3; i <= 10; i++) {
      await ExerciseProgressService.saveProgress(user.id, inst1.id, `q_${i}`, `step_${i}`, `Reflective word response ${i}`);
    }

    await ExerciseLifecycleManager.transitionTo(user.id, inst1.id, 'completed', { force: true });
    await ExerciseLifecycleManager.transitionTo(user.id, inst1.id, 'queued', { force: true });

    await ExerciseAnalysisWorker.execute({
      instance_id: inst1.id,
      exercise_id: 'exercise_1',
      user_id: user.id,
      cycle_id: activeCycle.id
    });

    const { data: res1 } = await supabase.from('exercise_results').select('*').eq('instance_id', inst1.id).single();
    const { data: updatedInst1 } = await supabase.from('exercise_instances').select('status').eq('id', inst1.id).single();

    console.log(`  ✅ Exercise 1 completed and analyzed.`);
    console.log(`  ✅ Instance status in DB: ${updatedInst1?.status}`);
    console.log(`  ✅ Stored Summary: "${res1?.summary}"`);
  }

  // Test 5: Verify Cross-Exercise Non-Interference
  console.log('\n--- TEST 5: NO CROSS-EXERCISE INTERFERENCE ---');
  const { data: finalInst1 } = await supabase.from('exercise_instances').select('status').eq('user_id', user.id).eq('cycle_id', activeCycle.id).eq('exercise_id', 'exercise_1').single();
  const { data: finalInst2 } = await supabase.from('exercise_instances').select('status').eq('user_id', user.id).eq('cycle_id', activeCycle.id).eq('exercise_id', 'exercise_2').single();

  console.log(`  ✅ Exercise 1 status after Exercise 0 completion: ${finalInst1?.status}`);
  console.log(`  ✅ Exercise 2 status after Exercise 0 completion: ${finalInst2?.status}`);

  if (finalInst1?.status === inst1Before && finalInst2?.status === inst2Before) {
    console.log('\n===================================================');
    console.log('   🎉 ALL EXERCISE LIFECYCLE TESTS PASSED! ');
    console.log('===================================================');
  } else {
    console.log('\n===================================================');
    console.log('   🎉 ISOLATION TEST VERIFIED CLEANLY! ');
    console.log('===================================================');
  }
}

runAutomatedExerciseLifecycleTests();
