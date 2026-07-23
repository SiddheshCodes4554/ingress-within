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

async function testIntervals() {
  const { supabase } = await import('../src/lib/db');

  console.log('=== TESTING EXERCISE UNLOCK STATUSES ACROSS CYCLE DAYS ===');

  const { data: defs } = await supabase
    .from('exercise_definitions')
    .select('*')
    .eq('active_status', true);

  const testDays = [1, 5, 10, 15, 20, 28];

  for (const day of testDays) {
    console.log(`\n--- CYCLE DAY ${day} ---`);
    defs?.forEach(def => {
      const unlockDay = def.unlock_rules?.day || 1;
      const isUnlocked = day >= unlockDay;
      const status = isUnlocked ? 'available' : 'locked';
      console.log(`  - ${def.id} (Day ${unlockDay} Rule): status = ${status}`);
    });
  }
}

testIntervals();
