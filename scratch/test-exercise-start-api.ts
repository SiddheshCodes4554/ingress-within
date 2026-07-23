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

async function testStartExercise() {
  const { supabase } = await import('../src/lib/db');
  const { ExerciseLifecycleManager } = await import('../src/lib/exercises/exerciseLifecycleManager');

  console.log('=== TESTING START EXERCISE API FUNCTIONALITY ===');

  const { data: user } = await supabase.from('profiles').select('id, full_name').limit(1).single();
  console.log(`User: ${user?.full_name} (${user?.id})`);

  const { data: activeCycle } = await supabase
    .from('cycles')
    .select('id')
    .eq('user_id', user?.id)
    .eq('status', 'ACTIVE')
    .single();

  const { data: inst } = await supabase
    .from('exercise_instances')
    .select('id, status, exercise_id')
    .eq('user_id', user?.id)
    .eq('cycle_id', activeCycle?.id)
    .eq('exercise_id', 'exercise_1')
    .single();

  console.log('Target instance for exercise_1:', inst);

  if (inst) {
    const updated = await ExerciseLifecycleManager.transitionTo(user!.id, inst.id, 'started', {
      transitionReason: 'Test exercise start'
    });
    console.log('Transition result:', { id: updated.id, status: updated.status });

    // Revert back to available for clean state
    await supabase.from('exercise_instances').update({ status: 'available', started: false }).eq('id', inst.id);
    console.log('Reset instance status back to available.');
  }
}

testStartExercise();
