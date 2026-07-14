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

  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  const testUser = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

  console.log('Targeting completed Cycle 1 (which contains 28 entries)...');
  const targetCycleId = '69d4b73b-f212-47be-a2d4-5ab965e12829';
  runWorker(db, testUser, targetCycleId);
}

async function runWorker(db: any, userId: string, cycleId: string) {
  console.log(`Running Monthly Report generator for user ${userId} and cycle ${cycleId}...`);

  // Ensure assessment row exists
  let { data: assessment } = await db
    .from('assessments')
    .select('*')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId)
    .maybeSingle();

  console.log('Cleaning up existing assessments for user to avoid unique constraint conflict...');
  await db.from('assessments').delete().eq('user_id', userId);

  console.log('Inserting assessment row...');
  const { data: newAss, error: insertErr } = await db
    .from('assessments')
    .insert({
      user_id: userId,
      cycle_id: cycleId,
      generation_status: 'pending',
      unlocked_at: new Date().toISOString(),
      ei_avg: 5,
      pr_avg: 5,
      sa_avg: 5,
      dt_score: 5,
      normalised_sa: 5,
      risk_total: 15,
      path_assignment: 'second_cycle',
      branch_assignment: 'A',
      entry_count: 28
    })
    .select()
    .single();

  if (insertErr) {
    console.error('Insert error:', insertErr.message);
  }
  assessment = newAss;

  // Import worker function
  const workerPath = pathToFileURL(path.join(process.cwd(), 'src/lib/queue/workers/monthlyReportWorker.ts')).href;
  const { processMonthlyReport } = await import(workerPath);

  try {
    await processMonthlyReport({
      cycle_id: cycleId,
      user_id: userId,
      assessment_id: assessment.id
    });

    console.log('\nReport generation completed successfully.');

    // Fetch the updated assessment record
    const { data: updatedAss } = await db
      .from('assessments')
      .select('*')
      .eq('id', assessment.id)
      .single();

    console.log('\nUpdated Assessment columns:', Object.keys(updatedAss));
    console.log('Generation Status:', updatedAss.generation_status);

    const reportData = JSON.parse(updatedAss.report_text);
    console.log('\nGenerated Report Structure keys:', Object.keys(reportData));
    console.log('\nStats:', reportData.stats);
    console.log('\nChart Data:', reportData.chartData);
    console.log('\nPatterns (Count):', reportData.patterns?.length);
    console.log('Recurring Themes (Count):', reportData.recurringThemes?.length);
    console.log('Closing Quote:', reportData.closingQuote);

    console.log('\n======================================================');
    console.log('SUCCESS: Structured Day 28 Cycle Report compiled!');
    console.log('======================================================');
    process.exit(0);
  } catch (err: any) {
    console.error('Failed to run worker:', err);
    process.exit(1);
  }
}

main().catch(console.error);
