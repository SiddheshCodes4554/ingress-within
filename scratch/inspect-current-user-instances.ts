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

async function inspectAllUsersAndInstances() {
  const { supabase } = await import('../src/lib/db');

  console.log('=== USERS & PROFILES ===');
  const { data: users } = await supabase.from('users').select('id, full_name, email');
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, onboarding_completed');
  console.log('Users in `users` table:', users);
  console.log('Profiles in `profiles` table:', profiles);

  console.log('\n=== ACTIVE CYCLES ===');
  const { data: cycles } = await supabase.from('cycles').select('id, user_id, status, current_day, created_at');
  console.log('Cycles in `cycles` table:', cycles);

  console.log('\n=== EXERCISE INSTANCES ===');
  const { data: instances } = await supabase.from('exercise_instances').select('id, user_id, cycle_id, exercise_id, status, available, started, completed');
  console.log('Instances count:', instances?.length);
  (instances || []).forEach(inst => {
    console.log(`User: ${inst.user_id} | Cycle: ${inst.cycle_id} | Ex: ${inst.exercise_id} | Status: ${inst.status}`);
  });

  console.log('\n=== EXERCISE RESPONSES ===');
  const { data: responses } = await supabase.from('exercise_responses').select('id, user_id, instance_id, question_id, response');
  console.log('Responses count:', responses?.length);
  (responses || []).forEach(r => {
    console.log(`User: ${r.user_id} | Instance: ${r.instance_id} | Q: ${r.question_id} | Response:`, typeof r.response === 'string' ? r.response.substring(0, 30) : r.response);
  });
}

inspectAllUsersAndInstances();
