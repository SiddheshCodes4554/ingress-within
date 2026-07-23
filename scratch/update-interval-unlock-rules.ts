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

async function updateIntervalUnlockRules() {
  const { supabase } = await import('../src/lib/db');

  console.log('=== UPDATING EXERCISE INTERVAL UNLOCK RULES ===');

  await supabase
    .from('exercise_definitions')
    .update({ unlock_rules: { strategy: 'immediate', day: 1 } })
    .eq('id', 'exercise_0');

  await supabase
    .from('exercise_definitions')
    .update({ unlock_rules: { strategy: 'day_milestone', day: 10 } })
    .eq('id', 'exercise_1');

  await supabase
    .from('exercise_definitions')
    .update({ unlock_rules: { strategy: 'day_milestone', day: 20 } })
    .eq('id', 'exercise_2');

  const { data: defs } = await supabase
    .from('exercise_definitions')
    .select('id, active_status, unlock_rules')
    .eq('active_status', true);

  console.log('Updated Definitions in DB:', defs);
}

updateIntervalUnlockRules();
