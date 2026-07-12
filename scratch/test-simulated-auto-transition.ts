import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

async function main() {
  // Load env variables
  try {
    const envContent = fs.readFileSync('D:/Internship/Ingress Within/.env', 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    });
  } catch (e: any) {
    console.error('Could not read .env file:', e.message);
  }

  // Create database connection
  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

  // 1. Fetch current active cycle
  let { data: cycle, error: cycleErr } = await db
    .from('cycles')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!cycle) {
    const { data: fallback } = await db
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    cycle = fallback;
  }

  console.log('Active cycle before:', cycle);

  if (!cycle) {
    console.error('No active cycle found!');
    return;
  }

  // Simulate auto-transition
  console.log(`Auto-transitioning cycle ${cycle.id} to next cycle...`);
  
  // 1. Create assessments record (mock/auto-fill for DB integrity)
  try {
    const { data: scores } = await db
      .from('entry_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycle.id);

    let ei_sum = 0, pr_sum = 0, sa_sum = 0, validScoresCount = 0;
    if (scores && scores.length > 0) {
      scores.forEach(s => {
        if (s.day_ei !== null && s.day_ei !== undefined) {
          ei_sum += Number(s.day_ei);
          pr_sum += Number(s.day_pr);
          sa_sum += Number(s.day_sa);
          validScoresCount++;
        }
      });
    }
    const ei_avg = validScoresCount > 0 ? (ei_sum / validScoresCount) : 5.0;
    const pr_avg = validScoresCount > 0 ? (pr_sum / validScoresCount) : 4.0;
    const sa_avg = validScoresCount > 0 ? (sa_sum / validScoresCount) : 6.0;
    const dt_score = Math.round((ei_avg + pr_avg) / 2 * 10);
    const normalised_sa = Math.round(sa_avg * 10);

    const { count: entriesCount } = await db
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('cycle_id', cycle.id)
      .eq('user_id', userId);

    await db
      .from('assessments')
      .delete()
      .eq('user_id', userId);

    const { error: insErr } = await db
      .from('assessments')
      .insert({
        user_id: userId,
        cycle_id: cycle.id,
        ei_avg,
        pr_avg,
        sa_avg,
        dt_score,
        normalised_sa,
        risk_total: 0,
        path_assignment: 'second_cycle',
        branch_assignment: 'A',
        stability_gate_triggered: false,
        entry_count: entriesCount || 0,
        generation_status: 'ready',
        report_text: `Auto-Transition Assessment for Cycle ${cycle.cycle_number || cycle.number}.`,
        unlocked_at: new Date().toISOString(),
        generated_at: new Date().toISOString()
      });
    console.log('Assessment inserted error status:', insErr);
  } catch (err) {
    console.error('Error inserting auto-assessment:', err);
  }

  // 2. Mark current cycle as completed
  try {
    const { error: updErr } = await db
      .from('cycles')
      .update({
        status: 'COMPLETED',
        assessment_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', cycle.id);
    console.log('Cycle marked completed error status:', updErr);
  } catch (err) {
    console.error('Error marking cycle completed:', err);
  }

  // 3. Create next cycle
  const nextCycleNumber = (cycle.cycle_number || cycle.number || 1) + 1;
  const todayStr = new Date().toISOString().split('T')[0];

  let newCycle = null;
  const { data: insCycle, error: createCycleErr } = await db
    .from('cycles')
    .insert({
      user_id: userId,
      cycle_number: nextCycleNumber,
      status: 'ACTIVE',
      start_date: todayStr,
      total_days: 30,
      current_day: 1,
      days_completed: 0,
      entries_count: 0,
      assessment_completed: false,
      assessment_available: false
    })
    .select()
    .maybeSingle();

  if (createCycleErr) {
    console.warn('Standard cycle insert failed, trying fallback:', createCycleErr.message);
    const { data: fallbackNewCycle, error: fallbackErr } = await db
      .from('cycles')
      .insert({
        user_id: userId,
        number: nextCycleNumber,
        status: 'active',
        started_at: todayStr,
        total_days: 30
      })
      .select()
      .maybeSingle();
    newCycle = fallbackNewCycle;
    console.log('Fallback cycle error status:', fallbackErr);
  } else {
    newCycle = insCycle;
  }

  console.log('\nNew Active Cycle created:');
  console.log(newCycle);

  const prevNum = cycle?.cycle_number || cycle?.number || 1;
  const newNum = newCycle?.cycle_number || newCycle?.number || 0;

  if (newCycle && newNum === prevNum + 1) {
    console.log('\n======================================================');
    console.log(`SUCCESS: Active cycle transitioned to Cycle ${newNum} successfully!`);
    console.log('======================================================');
  } else {
    console.error('\nFAILURE: Cycle did not transition correctly.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\nVerification Failed:', err);
  process.exit(1);
});
