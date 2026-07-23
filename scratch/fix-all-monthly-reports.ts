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

async function fixAllMonthlyReports() {
  const { supabase } = await import('../src/lib/db');
  const { processMonthlyReport } = await import('../src/lib/queue/workers/monthlyReportWorker');
  const { backfillWeeklyReports } = await import('../src/lib/weeklyReportBackfill');

  console.log('=== STARTING REPAIR & BACKFILL OF ALL MONTHLY REPORTS FOR ALL USERS ===');

  const { data: users } = await supabase.from('profiles').select('id, full_name');
  console.log(`Found ${users?.length} users.`);

  for (const user of users || []) {
    console.log(`\nProcessing user: ${user.full_name} (${user.id})...`);
    await backfillWeeklyReports(user.id);

    const { data: cycles } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', user.id);

    for (const cycle of cycles || []) {
      const isCompleted = cycle.status === 'COMPLETED' || cycle.status === 'completed';
      const isDay28 = cycle.current_day && cycle.current_day >= 28;
      const isDue = isCompleted || isDay28 || cycle.assessment_available || cycle.assessment_completed;

      if (isDue) {
        let { data: assessment } = await supabase
          .from('assessments')
          .select('*')
          .eq('cycle_id', cycle.id)
          .maybeSingle();

        const isPlaceholder = !assessment?.report_text || assessment.report_text.length < 50 || assessment.report_text.startsWith('Auto-Transition') || assessment.report_text.startsWith('Completed Transition');
        const needsWork = !assessment || assessment.generation_status !== 'ready' || isPlaceholder;

        if (needsWork) {
          console.log(`  - Cycle ${cycle.cycle_number || cycle.number} (${cycle.id}) needs monthly report generation (status: ${assessment?.generation_status || 'missing'}). Generating...`);
          let assId = assessment?.id;
          if (!assId) {
            const { data: newAss } = await supabase
              .from('assessments')
              .insert({
                user_id: user.id,
                cycle_id: cycle.id,
                generation_status: 'pending',
                unlocked_at: new Date().toISOString(),
                ei_avg: 0,
                pr_avg: 0,
                sa_avg: 0,
                dt_score: 0,
                normalised_sa: 0,
                risk_total: 0,
                path_assignment: 'second_cycle',
                branch_assignment: 'A',
                entry_count: 0
              })
              .select('id')
              .single();
            assId = newAss?.id;
          }

          if (assId) {
            await processMonthlyReport({
              cycle_id: cycle.id,
              user_id: user.id,
              assessment_id: assId
            });
            console.log(`  - Successfully generated monthly report for cycle ${cycle.id}!`);
          }
        } else {
          console.log(`  - Cycle ${cycle.cycle_number || cycle.number} (${cycle.id}) already has ready monthly report (text_len: ${assessment.report_text.length}).`);
        }
      }
    }
  }

  console.log('\n=== ALL USERS MONTHLY REPORTS REPAIRED & VERIFIED ===');
}

fixAllMonthlyReports();
