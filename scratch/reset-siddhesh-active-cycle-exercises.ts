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

async function resetActiveCycleExercises() {
  const { supabase } = await import('../src/lib/db');

  console.log('=== RESETTING ACTIVE CYCLE EXERCISES FOR ALL REAL USERS ===');

  const { data: activeCycles } = await supabase
    .from('cycles')
    .select('id, user_id')
    .eq('status', 'ACTIVE');

  console.log(`Found ${activeCycles?.length || 0} active cycles.`);

  for (const cycle of activeCycles || []) {
    console.log(`\nProcessing active cycle ${cycle.id} for user ${cycle.user_id}...`);

    // Fetch instances for this active cycle
    const { data: insts } = await supabase
      .from('exercise_instances')
      .select('id, exercise_id, status')
      .eq('cycle_id', cycle.id);

    for (const inst of insts || []) {
      console.log(`  Deleting instance ${inst.id} (${inst.exercise_id}, status: ${inst.status})...`);
      
      // Delete exercise_results for this instance
      await supabase.from('exercise_results').delete().eq('instance_id', inst.id);
      
      // Delete exercise_responses for this instance
      await supabase.from('exercise_responses').delete().eq('instance_id', inst.id);

      // Delete exercise_events for this instance
      await supabase.from('exercise_events').delete().eq('instance_id', inst.id);

      // Delete instance itself
      await supabase.from('exercise_instances').delete().eq('id', inst.id);
    }

    // Now insert fresh available instances for exercise_0, exercise_1, exercise_2
    const freshExercises = ['exercise_0', 'exercise_1', 'exercise_2'];
    for (const exId of freshExercises) {
      const { data: newInst, error } = await supabase
        .from('exercise_instances')
        .insert({
          user_id: cycle.user_id,
          cycle_id: cycle.id,
          exercise_id: exId,
          status: 'available',
          locked: false,
          available: true,
          started: false,
          completed: false,
          expired: false,
          unlock_time: new Date().toISOString(),
          version: '1.0'
        })
        .select()
        .single();

      if (error) {
        console.error(`  Failed to create fresh instance for ${exId}:`, error.message);
      } else {
        console.log(`  ✅ Created fresh available instance ${newInst.id} for ${exId}!`);
      }
    }
  }

  console.log('\n=== ALL ACTIVE CYCLE EXERCISES RESET SUCCESSFULLY ===');
}

resetActiveCycleExercises();
