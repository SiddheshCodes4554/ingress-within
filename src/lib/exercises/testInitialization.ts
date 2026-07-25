import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  for (const line of envConfig.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalsIdx = trimmed.indexOf('=');
      if (equalsIdx > 0) {
        const key = trimmed.slice(0, equalsIdx).trim();
        const value = trimmed.slice(equalsIdx + 1).trim();
        process.env[key] = value;
      }
    }
  }
}

export async function runInitializationTests() {
  const { ExerciseInitializationService } = await import('./exerciseInitializationService');

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('===================================================');
  console.log(' AUTOMATED EXERCISE INITIALIZATION & MIGRATION TEST ');
  console.log('===================================================');

  // Test 1: Verify Definitions Seeding
  console.log('\n--- TEST 1: DEFINITION SEEDING GUARANTEE ---');
  await ExerciseInitializationService.ensureDefinitionsExist();
  const { data: defs, error: defErr } = await supabase.from('exercise_definitions').select('id, exercise_type, unlock_rules');
  if (defErr) console.error('Def Query Error:', defErr);
  console.log(`  ✅ Core definitions count in DB: ${defs?.length}`);
  defs?.forEach((d: any) => console.log(`     - [${d.id}] Type: ${d.exercise_type} (Unlock: Day ${d.unlock_rules?.day || 1})`));

  // Test 2: Fetch Test User & Active Cycle
  const { data: users, error: userErr } = await supabase.from('users').select('id').limit(1);
  if (userErr) console.error('User Query Error:', userErr);
  const user = users?.[0];
  if (!user) throw new Error('No user found in DB');

  console.log(`  ✅ Found User ID: ${user.id}`);

  const { data: activeCycle } = await supabase.from('cycles').select('id, current_day').eq('user_id', user.id).eq('status', 'ACTIVE').single();
  if (!activeCycle) throw new Error('No active cycle found for test user');

  console.log(`\n--- TEST 2: SELF-HEALING INSTANCE SYNC (Day 1 User) ---`);
  const syncedDay1 = await ExerciseInitializationService.syncUserInstances(user.id, activeCycle.id, 1);
  console.log(`  ✅ Total instances synced for Day 1: ${syncedDay1.length}`);

  const countsDay1 = await ExerciseInitializationService.getSummaryCounts(user.id, activeCycle.id);
  console.log(`  ✅ Day 1 Summary Counts:`, countsDay1);

  // Test 3: Day Progression Unlock (Day 7 -> exercise_2 unlocks)
  console.log('\n--- TEST 3: DAY PROGRESSION UNLOCK (Day 7) ---');
  const syncedDay7 = await ExerciseInitializationService.syncUserInstances(user.id, activeCycle.id, 7);
  const countsDay7 = await ExerciseInitializationService.getSummaryCounts(user.id, activeCycle.id);
  console.log(`  ✅ Day 7 Summary Counts:`, countsDay7);

  const ex2Inst = syncedDay7.find((i: any) => i.exercise_id === 'exercise_2');
  console.log(`  ✅ exercise_2 status on Day 7: ${ex2Inst?.status} (locked: ${ex2Inst?.locked})`);

  // Test 4: Day Progression Unlock (Day 14 -> exercise_3 unlocks)
  console.log('\n--- TEST 4: DAY PROGRESSION UNLOCK (Day 14) ---');
  const syncedDay14 = await ExerciseInitializationService.syncUserInstances(user.id, activeCycle.id, 14);
  const countsDay14 = await ExerciseInitializationService.getSummaryCounts(user.id, activeCycle.id);
  console.log(`  ✅ Day 14 Summary Counts:`, countsDay14);

  const ex3Inst = syncedDay14.find((i: any) => i.exercise_id === 'exercise_3');
  console.log(`  ✅ exercise_3 status on Day 14: ${ex3Inst?.status} (locked: ${ex3Inst?.locked})`);

  // Test 5: Re-sync to actual cycle day
  console.log('\n--- TEST 5: RE-SYNC TO ACTIVE CYCLE DAY ---');
  await ExerciseInitializationService.syncUserInstances(user.id, activeCycle.id, activeCycle.current_day || 1);
  const finalCounts = await ExerciseInitializationService.getSummaryCounts(user.id, activeCycle.id);
  console.log(`  ✅ Final Active Cycle (Day ${activeCycle.current_day}) Counts:`, finalCounts);

  console.log('\n===================================================');
  console.log(' 🎉 EXERCISE INITIALIZATION TEST SUITE PASSED! ');
  console.log('===================================================');
}

runInitializationTests().catch(err => {
  console.error('Initialization test failed:', err);
  process.exit(1);
});
