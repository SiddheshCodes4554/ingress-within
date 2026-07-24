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

async function repairExerciseData() {
  const { supabase } = await import('../src/lib/db');
  const { ExerciseAnalysisWorker } = await import('../src/lib/exercises/exerciseAnalysisWorker');

  console.log('=== RUNNING ONE-TIME SAFE EXERCISE REPAIR UTILITY ===');

  // 1. Fetch all instances with joined results and responses
  const { data: instances, error } = await supabase
    .from('exercise_instances')
    .select('*, results:exercise_results(*), responses:exercise_responses(*)');

  if (error) {
    console.error('Failed to query exercise instances:', error);
    return;
  }

  console.log(`Inspecting ${instances?.length || 0} total instances across all users...`);

  let repairedCount = 0;
  let healthyCount = 0;

  // Group instances by user_id + cycle_id + exercise_id to detect duplicates
  const instanceGroups: Record<string, any[]> = {};
  for (const inst of instances || []) {
    const key = `${inst.user_id}:${inst.cycle_id}:${inst.exercise_id}`;
    if (!instanceGroups[key]) instanceGroups[key] = [];
    instanceGroups[key].push(inst);
  }

  // Handle duplicate instances safely
  for (const [key, group] of Object.entries(instanceGroups)) {
    if (group.length > 1) {
      console.log(`\n⚠️ Found ${group.length} duplicate instances for ${key}`);
      // Sort group: finished/with results first, then most responses, then newest
      group.sort((a, b) => {
        const aHasResult = (a.results?.length || 0) > 0 ? 1 : 0;
        const bHasResult = (b.results?.length || 0) > 0 ? 1 : 0;
        if (aHasResult !== bHasResult) return bHasResult - aHasResult;
        const aRespCount = a.responses?.length || 0;
        const bRespCount = b.responses?.length || 0;
        if (aRespCount !== bRespCount) return bRespCount - aRespCount;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      const primary = group[0];
      const duplicates = group.slice(1);

      for (const dup of duplicates) {
        if (dup.status !== 'archived') {
          console.log(`  Archiving duplicate instance ${dup.id} (status: ${dup.status})...`);
          await supabase.from('exercise_instances').update({ status: 'archived' }).eq('id', dup.id);
          repairedCount++;
        }
      }
    }
  }

  // Repair inconsistent records
  for (const inst of instances || []) {
    if (inst.status === 'archived') continue;

    const hasResult = (inst.results?.length || 0) > 0;
    const hasResponses = (inst.responses?.filter((r: any) => r.question_id !== '__screen_state').length || 0) > 0;

    // Case 1: Has results but status is not finished
    if (hasResult && inst.status !== 'finished') {
      console.log(`\n🔧 Repairing instance ${inst.id} (${inst.exercise_id}): Has result but status is "${inst.status}". Updating status to "finished"...`);
      await supabase.from('exercise_instances').update({
        status: 'finished',
        completed: true,
        started: true,
        available: true,
        locked: false,
        updated_at: new Date().toISOString()
      }).eq('id', inst.id);
      repairedCount++;
      continue;
    }

    // Case 2: Status is finished or completed, but missing analysis result
    if (['finished', 'completed', 'queued', 'analysing'].includes(inst.status) && !hasResult && hasResponses) {
      console.log(`\n🔧 Repairing instance ${inst.id} (${inst.exercise_id}): Status "${inst.status}" with answers but missing result. Executing ExerciseAnalysisWorker...`);
      try {
        await ExerciseAnalysisWorker.execute({
          instance_id: inst.id,
          exercise_id: inst.exercise_id,
          user_id: inst.user_id,
          cycle_id: inst.cycle_id
        });
        repairedCount++;
      } catch (wErr: any) {
        console.error(`Failed to repair missing result for instance ${inst.id}:`, wErr.message);
      }
      continue;
    }

    // Record is healthy
    healthyCount++;
  }

  console.log(`\n=== REPAIR COMPLETE ===`);
  console.log(`Healthy records preserved: ${healthyCount}`);
  console.log(`Inconsistent records repaired: ${repairedCount}`);
}

repairExerciseData();
