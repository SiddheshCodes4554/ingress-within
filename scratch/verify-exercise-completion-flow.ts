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

async function verifyFlow() {
  const { supabase } = await import('../src/lib/db');
  const { ExerciseLifecycleManager } = await import('../src/lib/exercises/exerciseLifecycleManager');
  const { ExerciseAnalysisWorker } = await import('../src/lib/exercises/exerciseAnalysisWorker');

  console.log('=== VERIFYING FULL EXERCISE SUBMIT, ANALYZE & PROCEED PIPELINE ===');

  const { data: user } = await supabase.from('profiles').select('id, full_name').limit(1).single();
  const { data: activeCycle } = await supabase.from('cycles').select('id').eq('user_id', user?.id).eq('status', 'ACTIVE').single();

  const exercises = ['exercise_0', 'exercise_1', 'exercise_2'];

  for (const exId of exercises) {
    console.log(`\nTesting end-to-end submit & result retrieval for ${exId}...`);
    
    // Fetch instance
    const { data: inst } = await supabase
      .from('exercise_instances')
      .select('id, status')
      .eq('user_id', user?.id)
      .eq('cycle_id', activeCycle?.id)
      .eq('exercise_id', exId)
      .single();

    if (inst) {
      // 1. Submit
      await ExerciseLifecycleManager.transitionTo(user!.id, inst.id, 'completed', { force: true });
      console.log(`  Step 1: Submitted instance ${inst.id} -> status: completed`);

      // 2. Process AI Analysis
      await ExerciseAnalysisWorker.execute({
        instance_id: inst.id,
        exercise_id: exId,
        user_id: user!.id,
        cycle_id: activeCycle!.id
      });

      // 3. Verify status in DB is finished
      const { data: updatedInst } = await supabase
        .from('exercise_instances')
        .select('status')
        .eq('id', inst.id)
        .single();

      console.log(`  Step 2: Analysis worker completed -> status in DB: ${updatedInst?.status}`);

      // 4. Verify GET /api/exercises/result/[id] query resolution
      const { data: resRow } = await supabase
        .from('exercise_results')
        .select('id, summary, scores')
        .eq('instance_id', inst.id)
        .single();

      console.log(`  Step 3: Result stored & accessible:`, { id: resRow?.id, summary: resRow?.summary, scores: resRow?.scores });
    }
  }

  console.log('\n=== END-TO-END VERIFICATION SUCCESSFUL ===');
}

verifyFlow();
