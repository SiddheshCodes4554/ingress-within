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

async function inspectUnlockRules() {
  const { supabase } = await import('../src/lib/db');

  console.log('=== INSPECTING UNLOCK RULES IN EXERCISE DEFINITIONS ===');
  const { data: defs } = await supabase.from('exercise_definitions').select('*');
  console.log(defs?.map(d => ({ id: d.id, active: d.active_status, rules: d.unlock_rules })));
}

inspectUnlockRules();
