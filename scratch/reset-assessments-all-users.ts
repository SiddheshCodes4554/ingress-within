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

async function resetAssessmentsForAllUsers() {
  const { supabase } = await import('../src/lib/db');

  console.log('=== RESETTING ASSESSMENTS FOR ALL USERS ACROSS ALL ACTIVE CYCLES ===');

  // Fetch all active cycles
  const { data: activeCycles, error: cycleErr } = await supabase
    .from('cycles')
    .select('id, user_id')
    .eq('status', 'ACTIVE');

  if (cycleErr) {
    console.error('Error fetching active cycles:', cycleErr);
    return;
  }

  console.log(`Found ${activeCycles?.length || 0} active cycles across all users.`);

  for (const cycle of activeCycles || []) {
    console.log(`\nProcessing active cycle ${cycle.id} for user ${cycle.user_id}...`);

    // Fetch existing exercise_instances for this active cycle
    const { data: insts } = await supabase
      .from('exercise_instances')
      .select('id, exercise_id, status')
      .eq('cycle_id', cycle.id);

    for (const inst of insts || []) {
      console.log(`  Purging instance ${inst.id} (${inst.exercise_id}, status: ${inst.status})...`);
      await supabase.from('exercise_results').delete().eq('instance_id', inst.id);
      await supabase.from('exercise_responses').delete().eq('instance_id', inst.id);
      await supabase.from('exercise_events').delete().eq('instance_id', inst.id);
      await supabase.from('exercise_instances').delete().eq('id', inst.id);
    }

    // Insert fresh available instances for exercise_0, exercise_1, exercise_2
    const targetExercises = ['exercise_0', 'exercise_1', 'exercise_2'];
    for (const exId of targetExercises) {
      const { data: newInst, error: insErr } = await supabase
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
        .maybeSingle();

      if (insErr) {
        console.error(`  ⚠️ Could not insert fresh instance for ${exId}:`, insErr.message);
      } else if (newInst) {
        console.log(`  ✅ Created fresh available instance ${newInst.id} for ${exId}!`);
      }
    }
  }

  console.log('\n=== ALL USER ASSESSMENTS RESET SUCCESSFULLY ===');
}

resetAssessmentsForAllUsers();
