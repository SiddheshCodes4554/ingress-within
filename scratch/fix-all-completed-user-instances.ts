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

async function checkInstances() {
  const { supabase } = await import('../src/lib/db');
  const { ExerciseAnalysisWorker } = await import('../src/lib/exercises/exerciseAnalysisWorker');

  console.log('=== CHECKING ALL EXERCISE INSTANCES IN DATABASE ===');

  const { data: instances, error } = await supabase
    .from('exercise_instances')
    .select('*, results:exercise_results(*)');

  if (error) {
    console.error('Error fetching instances:', error);
    return;
  }

  console.log(`Found ${instances?.length || 0} total instances:`);

  for (const inst of instances || []) {
    console.log(`\nInstance ID: ${inst.id}`);
    console.log(`  User ID: ${inst.user_id}`);
    console.log(`  Exercise ID: ${inst.exercise_id}`);
    console.log(`  Status: ${inst.status}`);
    console.log(`  Results count: ${inst.results?.length || 0}`);

    if (['completed', 'queued', 'analysing', 'failed'].includes(inst.status) || (inst.results?.length === 0 && inst.status !== 'available' && inst.status !== 'locked')) {
      console.log(`  ⚠️ Instance ${inst.id} is in status "${inst.status}" without finished result. Running ExerciseAnalysisWorker...`);
      try {
        await ExerciseAnalysisWorker.execute({
          instance_id: inst.id,
          exercise_id: inst.exercise_id,
          user_id: inst.user_id,
          cycle_id: inst.cycle_id
        });
        console.log(`  ✅ Repair completed for instance ${inst.id}!`);
      } catch (wErr: any) {
        console.error(`  ❌ Repair failed for instance ${inst.id}:`, wErr.message);
      }
    }
  }

  console.log('\n=== DB REPAIR & INSPECTION COMPLETED ===');
}

checkInstances();
