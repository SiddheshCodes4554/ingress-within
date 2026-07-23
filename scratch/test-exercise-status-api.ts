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

async function testExerciseStatus() {
  const { supabase } = await import('../src/lib/db');

  const { data: users } = await supabase.from('profiles').select('id, full_name');

  for (const u of users || []) {
    console.log(`\n=== USER: ${u.full_name} (${u.id}) ===`);
    const { data: activeCycle } = await supabase
      .from('cycles')
      .select('id, cycle_number')
      .eq('user_id', u.id)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (!activeCycle) {
      console.log('No active cycle.');
      continue;
    }

    const { data: defs } = await supabase.from('exercise_definitions').select('*').eq('active_status', true);
    const { data: insts } = await supabase.from('exercise_instances').select('*').eq('user_id', u.id).eq('cycle_id', activeCycle.id);

    console.log(`Active Cycle ID: ${activeCycle.id}`);
    console.log('Exercise Statuses:');
    defs?.forEach(def => {
      const inst = insts?.find(i => i.exercise_id === def.id);
      console.log(`  - ${def.id}: status = ${inst ? inst.status : 'available'} (instance_id: ${inst?.id || 'none'})`);
    });
  }
}

testExerciseStatus();
