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

async function inspectSchema() {
  const { supabase } = await import('../src/lib/db');

  console.log('=== TESTING SAVE PROGRESS UPSERT ===');

  const { data: user } = await supabase.from('profiles').select('id').limit(1).single();
  const { data: inst } = await supabase.from('exercise_instances').select('id, status').eq('user_id', user?.id).eq('exercise_id', 'exercise_1').limit(1).single();

  console.log(`User ID: ${user?.id}, Instance ID: ${inst?.id}, status: ${inst?.status}`);

  if (inst) {
    // Attempt saving progress step 1
    const { data, error } = await supabase
      .from('exercise_responses')
      .upsert({
        instance_id: inst.id,
        user_id: user!.id,
        question_id: 'q_1',
        step_id: 'step_1',
        response: 'Reflection word association test answer',
        metadata: {},
        created_at: new Date().toISOString()
      }, { onConflict: 'instance_id,question_id' })
      .select();

    if (error) {
      console.error('UPSERT ERROR:', error);
    } else {
      console.log('UPSERT SUCCESS:', data);
    }
  }
}

inspectSchema();
