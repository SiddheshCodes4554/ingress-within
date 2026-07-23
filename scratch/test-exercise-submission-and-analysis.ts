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

async function testSubmissionAndAnalysis() {
  const { supabase } = await import('../src/lib/db');
  const { ExerciseAnalysisWorker } = await import('../src/lib/exercises/exerciseAnalysisWorker');

  console.log('=== TESTING EXERCISE SUBMISSION & AI ANALYSIS WORKER ===');

  const { data: user } = await supabase.from('profiles').select('id, full_name').limit(1).single();
  const { data: activeCycle } = await supabase.from('cycles').select('id').eq('user_id', user?.id).eq('status', 'ACTIVE').single();

  const exercises = ['exercise_0', 'exercise_1', 'exercise_2'];

  for (const exId of exercises) {
    console.log(`\nTesting submission & analysis for ${exId}...`);
    const { data: inst } = await supabase
      .from('exercise_instances')
      .select('id, status')
      .eq('user_id', user?.id)
      .eq('cycle_id', activeCycle?.id)
      .eq('exercise_id', exId)
      .single();

    if (inst) {
      // Ensure at least one response exists
      await supabase.from('exercise_responses').upsert({
        instance_id: inst.id,
        user_id: user!.id,
        question_id: 'q_1',
        step_id: 'step_1',
        response: exId === 'exercise_0' ? 4 : 'Integration test reflective association',
        created_at: new Date().toISOString()
      }, { onConflict: 'instance_id,question_id' });

      // Run Analysis Worker
      try {
        await ExerciseAnalysisWorker.execute({
          instance_id: inst.id,
          exercise_id: exId,
          user_id: user!.id,
          cycle_id: activeCycle!.id
        });
        console.log(`  ✅ ExerciseAnalysisWorker completed successfully for ${exId}!`);

        // Check updated status and exercise_results
        const { data: updatedInst } = await supabase.from('exercise_instances').select('status').eq('id', inst.id).single();
        const { data: result } = await supabase.from('exercise_results').select('id, summary, scores').eq('instance_id', inst.id).maybeSingle();

        console.log(`  Status in DB: ${updatedInst?.status}`);
        console.log(`  Result in DB:`, { id: result?.id, summary: result?.summary, scores: result?.scores });
      } catch (err: any) {
        console.error(`  ❌ ExerciseAnalysisWorker failed for ${exId}:`, err.message);
      }
    }
  }

  console.log('\n=== SUBMISSION & ANALYSIS VERIFICATION COMPLETE ===');
}

testSubmissionAndAnalysis();
