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

async function unlockAllUsers() {
  const { supabase } = await import('../src/lib/db');

  console.log('=== UNLOCKING EX0, EX1, EX2 FOR ALL USERS ACROSS ACTIVE CYCLES ===');

  const { data: users } = await supabase.from('profiles').select('id, full_name');
  console.log(`Found ${users?.length} users.`);

  const activeDefs = ['exercise_0', 'exercise_1', 'exercise_2'];

  for (const user of users || []) {
    console.log(`\nProcessing user ${user.full_name} (${user.id})...`);

    // Ensure user has an active cycle
    let { data: activeCycle } = await supabase
      .from('cycles')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (!activeCycle) {
      console.log(`User ${user.id} has no active cycle. Creating Cycle 1 ACTIVE...`);
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: newCycle } = await supabase
        .from('cycles')
        .insert({
          user_id: user.id,
          cycle_number: 1,
          status: 'ACTIVE',
          start_date: todayStr,
          total_days: 30,
          current_day: 1,
          days_completed: 0,
          entries_count: 0,
          assessment_completed: false,
          assessment_available: false
        })
        .select('id')
        .single();
      activeCycle = newCycle;
    }

    if (activeCycle) {
      for (const defId of activeDefs) {
        // Check if an available or finished instance already exists
        const { data: existing } = await supabase
          .from('exercise_instances')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('cycle_id', activeCycle.id)
          .eq('exercise_id', defId)
          .maybeSingle();

        if (!existing) {
          await supabase
            .from('exercise_instances')
            .insert({
              user_id: user.id,
              cycle_id: activeCycle.id,
              exercise_id: defId,
              status: 'available',
              locked: false,
              available: true,
              started: false,
              completed: false,
              expired: false,
              unlock_time: new Date().toISOString(),
              version: '1.0'
            });
          console.log(`  - Unlocked ${defId} for user ${user.id} in cycle ${activeCycle.id}`);
        } else {
          console.log(`  - ${defId} already exists for user ${user.id} (status: ${existing.status})`);
        }
      }
    }
  }

  console.log('\n=== UNLOCK FOR ALL USERS COMPLETED CLEANLY ===');
}

unlockAllUsers();
