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

async function inspectExerciseData() {
  const { supabase } = await import('../src/lib/db');

  console.log('=== INSPECTING EXERCISE DEFINITIONS & INSTANCES ===');

  const { data: defs } = await supabase.from('exercise_definitions').select('*');
  console.log('Definitions:', defs?.map(d => ({ id: d.id, title: d.title, active: d.active_status })));

  const { data: insts } = await supabase.from('exercise_instances').select('*');
  console.log(`Total instances in DB: ${insts?.length}`);
  console.log('Instances details:', insts?.map(i => ({
    id: i.id,
    user_id: i.user_id,
    exercise_id: i.exercise_id,
    status: i.status,
    completed_at: i.completion_time
  })));
}

inspectExerciseData();
