import fs from 'fs';
import path from 'path';

// Load environment variables synchronously
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

async function unlockAllExercises() {
  const { supabase } = await import('../src/lib/db');

  console.log('=== UNLOCKING ALL EXERCISES FOR ALL USERS ===');

  // 1. Fetch all active exercise definitions
  const { data: definitions, error: defErr } = await supabase
    .from('exercise_definitions')
    .select('*');

  if (defErr || !definitions) {
    console.error('Failed to fetch exercise definitions:', defErr?.message);
    process.exit(1);
  }

  console.log(`Found ${definitions.length} exercise definitions:`, definitions.map(d => d.id));

  // 2. Fetch all active cycles
  const { data: cycles, error: cycleErr } = await supabase
    .from('cycles')
    .select('id, user_id');

  if (cycleErr || !cycles) {
    console.error('Failed to fetch cycles:', cycleErr?.message);
    process.exit(1);
  }

  console.log(`Found ${cycles.length} active cycles across users.`);

  let unlockedCount = 0;
  let updatedCount = 0;

  for (const cycle of cycles) {
    const userId = cycle.user_id;
    const cycleId = cycle.id;

    for (const def of definitions) {
      // Check if instance exists for user and cycle
      const { data: existing } = await supabase
        .from('exercise_instances')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_id', def.id)
        .eq('cycle_id', cycleId)
        .maybeSingle();

      if (!existing) {
        // Create new available instance
        const { error: insertErr } = await supabase
          .from('exercise_instances')
          .insert({
            user_id: userId,
            cycle_id: cycleId,
            exercise_id: def.id,
            status: 'available',
            locked: false,
            available: true,
            started: false,
            completed: false,
            expired: false,
            unlock_time: new Date().toISOString(),
            version: def.provider_version || '1.0'
          });

        if (insertErr) {
          console.error(`Failed to unlock ${def.id} for user ${userId}:`, insertErr.message);
        } else {
          unlockedCount++;
          console.log(` unlocked ${def.id} for user ${userId}`);
        }
      } else if (existing.locked || existing.status === 'locked') {
        // Unlock locked instance without resetting progress if already finished/started
        const newStatus = existing.status === 'locked' ? 'available' : existing.status;
        const { error: updateErr } = await supabase
          .from('exercise_instances')
          .update({
            locked: false,
            available: true,
            status: newStatus
          })
          .eq('id', existing.id);

        if (updateErr) {
          console.error(`Failed to update status for instance ${existing.id}:`, updateErr.message);
        } else {
          updatedCount++;
          console.log(` unlocked locked instance ${def.id} for user ${userId}`);
        }
      }
    }
  }

  console.log(`\n✅ UNLOCK COMPLETE! Newly Unlocked: ${unlockedCount}, Updated Locked -> Available: ${updatedCount}`);
}

unlockAllExercises();
