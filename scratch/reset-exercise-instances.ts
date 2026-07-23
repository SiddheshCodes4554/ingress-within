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

async function resetExerciseInstances() {
  const { supabase } = await import('../src/lib/db');

  console.log('=== RESETTING EXERCISE INSTANCES FOR ALL ACTIVE CYCLES ===');

  const { data: cycles } = await supabase.from('cycles').select('id, user_id').eq('status', 'ACTIVE');
  console.log(`Active cycles count: ${cycles?.length}`);

  // Delete all existing exercise instances for active cycles so users can take them fresh
  for (const c of cycles || []) {
    const { error: delErr } = await supabase
      .from('exercise_instances')
      .delete()
      .eq('cycle_id', c.id);
    console.log(`Deleted instances for active cycle ${c.id}: ${delErr ? delErr.message : 'SUCCESS'}`);

    // Create fresh available instances for all 5 defined exercises
    const defs = ['exercise_0', 'exercise_1', 'exercise_2', 'exercise_3', 'cbt_reframing'];
    for (const defId of defs) {
      await supabase
        .from('exercise_instances')
        .insert({
          user_id: c.user_id,
          cycle_id: c.id,
          exercise_id: defId,
          status: 'available',
          step_data: {},
          completed_at: null
        });
    }
    console.log(`Initialized 5 fresh available exercises for user ${c.user_id} in cycle ${c.id}.`);
  }

  console.log('=== EXERCISE INSTANCES CLEANED & RESET TO AVAILABLE ===');
}

resetExerciseInstances();
