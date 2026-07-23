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

async function testAllExerciseFlows() {
  const { supabase } = await import('../src/lib/db');
  const { ExerciseProgressService } = await import('../src/lib/exercises/exerciseProgressService');

  console.log('=== TESTING SAVE PROGRESS FOR EX0, EX1, EX2 ===');

  const { data: user } = await supabase.from('profiles').select('id, full_name').limit(1).single();
  console.log(`User: ${user?.full_name} (${user?.id})`);

  const { data: activeCycle } = await supabase
    .from('cycles')
    .select('id')
    .eq('user_id', user?.id)
    .eq('status', 'ACTIVE')
    .single();

  const exercises = ['exercise_0', 'exercise_1', 'exercise_2'];

  for (const exId of exercises) {
    console.log(`\nTesting ${exId}...`);
    let { data: inst } = await supabase
      .from('exercise_instances')
      .select('id, status')
      .eq('user_id', user?.id)
      .eq('cycle_id', activeCycle?.id)
      .eq('exercise_id', exId)
      .maybeSingle();

    if (!inst) {
      console.log(`  No instance found for ${exId}, creating...`);
      const { data: newInst } = await supabase
        .from('exercise_instances')
        .insert({
          user_id: user!.id,
          cycle_id: activeCycle!.id,
          exercise_id: exId,
          status: 'available',
          locked: false,
          available: true,
          version: '1.0'
        })
        .select('id, status')
        .single();
      inst = newInst;
    }

    console.log(`  Instance ID: ${inst?.id}, initial status: ${inst?.status}`);

    try {
      await ExerciseProgressService.saveProgress(
        user!.id,
        inst!.id,
        'q_1',
        'step_1',
        'Test automated progress response string',
        { test: true }
      );
      console.log(`  ✅ Successfully saved progress for ${exId}!`);

      // Verify stored row in exercise_responses
      const { data: resp } = await supabase
        .from('exercise_responses')
        .select('*')
        .eq('instance_id', inst!.id)
        .eq('question_id', 'q_1')
        .single();

      console.log(`  Verified stored response row in DB:`, { id: resp?.id, question_id: resp?.question_id, response: resp?.response });
    } catch (err: any) {
      console.error(`  ❌ Failed to save progress for ${exId}:`, err.message);
    }
  }

  console.log('\n=== ALL EXERCISE SAVE FLOW TESTS COMPLETED ===');
}

testAllExerciseFlows();
