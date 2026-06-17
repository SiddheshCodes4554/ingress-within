import fs from 'fs';
import path from 'path';

// 1. Load environment variables from .env first
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim();
      if (key && val) {
        process.env[key.trim()] = val;
      }
    }
    console.log('[Test Setup] Loaded environment variables from .env successfully.');
  }
} catch (err) {
  console.error('[Test Setup] Error loading .env file:', err);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Test Setup] Missing Supabase config. Please check your .env.');
  process.exit(1);
}

async function runQueueTest() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Import Queue elements dynamically after env is loaded
  const { queueRegistry } = await import('../src/lib/queue/registry');
  const { workerRegistry } = await import('../src/lib/queue/workerRegistry');
  const { printQueueStatus } = await import('../src/lib/queue/monitoring');
  const { connection } = await import('../src/lib/queue/config');

  console.log('\n==================================================');
  console.log('🚀 INITIATING BACKGROUND QUEUES INTEGRATION TEST');
  console.log('==================================================\n');

  // Fetch test subjects
  const { data: users } = await supabase.from('users').select('*').limit(1);
  const user = users?.[0];

  if (!user) {
    console.error('❌ Error: No user found in the database. Run migration/seeding first.');
    process.exit(1);
  }

  const { data: cycles } = await supabase.from('cycles').select('*').eq('user_id', user.id).limit(1);
  const cycle = cycles?.[0];

  if (!cycle) {
    console.error('❌ Error: No cycle found for the test user. Run seeding first.');
    process.exit(1);
  }

  // Ensure we have an entry to work with
  const { data: entries } = await supabase.from('entries').select('*').eq('user_id', user.id).limit(1);
  let entry = entries?.[0];

  if (!entry) {
    console.log('No existing entries found. Creating a test entry...');
    const { data: newEntry, error } = await supabase
      .from('entries')
      .insert({
        user_id: user.id,
        cycle_id: cycle.id,
        cycle_day: 7,
        content: 'I feel stressed about work, but I am trying to stay calm. Conflict makes me anxious.',
        new_entry_text_encrypted: 'I feel stressed about work, but I am trying to stay calm. Conflict makes me anxious.',
        entry_type: 'new_only',
        word_count: 15,
        written_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error || !newEntry) {
      console.error('Failed to create test entry:', error?.message);
      process.exit(1);
    }
    entry = newEntry;
  }

  // Ensure we have an exercise to work with
  const { data: exercises } = await supabase.from('exercises').select('*').eq('user_id', user.id).limit(1);
  let exercise = exercises?.[0];

  if (!exercise) {
    console.log('No existing exercises found. Creating a test exercise...');
    const { data: newExercise, error } = await supabase
      .from('exercises')
      .insert({
        user_id: user.id,
        cycle_id: cycle.id,
        cycle_day: 7,
        template_id: 'cbt_reframing',
        surfaced_at: new Date().toISOString(),
        response_encrypted: JSON.stringify({
          stressor_type: 'Work pressure',
          reactive_thought: 'If I fail, my boss will fire me immediately.',
          reframed_thought: 'Failure is a learning step. My boss values my dedication.',
          clarity_score: 80
        }),
        status: 'pending'
      })
      .select()
      .single();

    if (error || !newExercise) {
      console.error('Failed to create test exercise:', error?.message);
      process.exit(1);
    }
    exercise = newExercise;
  }

  // Start workers
  console.log('[Test] Starting background workers daemon...');
  workerRegistry.startAll();

  // Seeding pending rows for weekly summary and assessments so we can test their workers
  console.log('[Test] Creating pending summary and assessment records...');
  
  const { data: summary } = await supabase
    .from('weekly_summaries')
    .upsert({
      user_id: user.id,
      cycle_id: cycle.id,
      week_number: 1,
      day_start: 1,
      day_end: 7,
      status: 'pending'
    }, { onConflict: 'cycle_id,week_number' })
    .select()
    .single();

  const { data: assessment } = await supabase
    .from('assessments')
    .upsert({
      user_id: user.id,
      cycle_id: cycle.id,
      generation_status: 'pending',
      ei_avg: 0,
      pr_avg: 0,
      sa_avg: 0,
      dt_score: 0,
      normalised_sa: 0,
      risk_total: 0,
      path_assignment: 'second_cycle',
      branch_assignment: 'A',
      entry_count: 0
    }, { onConflict: 'user_id' })
    .select()
    .single();

  // Enqueue test jobs
  console.log('[Test] Enqueueing jobs for all 7 queues...');

  await Promise.all([
    // 1. Entry Scoring
    queueRegistry.addJob('entry_scoring', `test_score_${entry.id}`, {
      entry_id: entry.id,
      user_id: user.id
    }),
    // 2. Reflection
    queueRegistry.addJob('reflection_generation', `test_refl_${entry.id}`, {
      entry_id: entry.id,
      user_id: user.id
    }),
    // 3. Crisis Detection
    queueRegistry.addJob('crisis_detection', `test_crisis_${entry.id}`, {
      entry_id: entry.id,
      user_id: user.id
    }),
    // 4. Weekly Summary
    queueRegistry.addJob('weekly_summary_generation', `test_weekly_${summary.id}`, {
      cycle_id: cycle.id,
      user_id: user.id,
      week_number: 1,
      summary_id: summary.id
    }),
    // 5. Monthly Report
    queueRegistry.addJob('monthly_report_generation', `test_assessment_${assessment.id}`, {
      cycle_id: cycle.id,
      user_id: user.id,
      assessment_id: assessment.id,
      month_number: 1
    }),
    // 6. OCEAN Summary
    queueRegistry.addJob('ocean_summary_generation', `test_ocean_${user.id}`, {
      user_id: user.id,
      answers: {
        q1: 4, q2: 4, q3: 3, q4: 5, q5: 2, q6: 3,
        q7: 4, q8: 4, q9: 5, q10: 2, q11: 1, q12: 2
      }
    }),
    // 7. Exercise Insight
    queueRegistry.addJob('exercise_insight_generation', `test_exercise_${exercise.id}`, {
      exercise_id: exercise.id,
      user_id: user.id
    })
  ]);

  console.log('[Test] Jobs queued successfully. Waiting 10 seconds for completion...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Print Queue status
  console.log('[Test] Printing BullMQ health metrics:');
  await printQueueStatus();

  // Query database to verify updates
  console.log('[Test] Verifying database updates in Supabase...');

  const { data: updatedEntry } = await supabase.from('entries').select('*').eq('id', entry.id).single();
  console.log(`- Entry scoring status: ${updatedEntry?.scoring_status} (EI: ${updatedEntry?.day_ei}, PR: ${updatedEntry?.day_pr}, SA: ${updatedEntry?.day_sa})`);

  const { data: updatedReflection } = await supabase.from('reflections').select('*').eq('entry_id', entry.id).maybeSingle();
  console.log(`- Reflection status: ${updatedReflection?.status} (${updatedReflection?.question ? 'Question generated!' : 'No question'})`);

  const { data: updatedUser } = await supabase.from('users').select('crisis_flag_active, personality_summary_text').eq('id', user.id).single();
  console.log(`- User crisis flag: ${updatedUser?.crisis_flag_active}`);
  console.log(`- User OCEAN summary: ${updatedUser?.personality_summary_text ? 'Generated! Length: ' + updatedUser.personality_summary_text.length : 'Missing!'}`);

  const { data: updatedSummary } = await supabase.from('weekly_summaries').select('*').eq('id', summary.id).single();
  console.log(`- Weekly summary status: ${updatedSummary?.status} (${updatedSummary?.body ? 'Body generated!' : 'No body'})`);

  const { data: updatedAssessment } = await supabase.from('assessments').select('*').eq('id', assessment.id).single();
  console.log(`- Assessment status: ${updatedAssessment?.generation_status} (Risk: ${updatedAssessment?.risk_total}, Path: ${updatedAssessment?.path_assignment}, Branch: ${updatedAssessment?.branch_assignment})`);

  const { data: updatedExercise } = await supabase.from('exercises').select('*').eq('id', exercise.id).single();
  console.log(`- Exercise status: ${updatedExercise?.status} (Insight note exists: ${!!updatedExercise?.insight_note})`);

  // Stop workers and connections gracefully
  console.log('\n[Test] Terminating workers and closing database/Redis connections...');
  await workerRegistry.stopAll();
  await queueRegistry.closeAll();
  await connection.quit();

  console.log('\n==================================================');
  console.log('🎉 BACKGROUND QUEUES INTEGRATION TEST COMPLETED');
  console.log('==================================================\n');
}

runQueueTest().catch(err => {
  console.error('Error during queue integration test:', err);
  process.exit(1);
});
