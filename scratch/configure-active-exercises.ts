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

async function configureActiveExercises() {
  const { supabase } = await import('../src/lib/db');

  console.log('=== CONFIGURING EXERCISE DEFINITIONS (ONLY EX0, EX1, EX2 ACTIVE) ===');

  // Deactivate unbuilt exercises (exercise_3, cbt_reframing)
  await supabase
    .from('exercise_definitions')
    .update({ active_status: false })
    .in('id', ['exercise_3', 'cbt_reframing']);

  // Ensure exercise_0, exercise_1, exercise_2 are active
  await supabase
    .from('exercise_definitions')
    .update({ active_status: true })
    .in('id', ['exercise_0', 'exercise_1', 'exercise_2']);

  const { data: defs } = await supabase.from('exercise_definitions').select('*');
  console.log('Definitions status in DB:', defs?.map(d => ({ id: d.id, title: d.title, active: d.active_status })));
}

configureActiveExercises();
