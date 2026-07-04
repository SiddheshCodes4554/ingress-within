import './load-env';
import { supabase } from '../src/lib/db';

async function run() {
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
  const cycleId = 'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da';

  // 1. Fetch Cycle
  const { data: cycle, error: cycleErr } = await supabase
    .from('cycles')
    .select('*')
    .eq('id', cycleId)
    .single();

  console.log('=== CYCLE DETAILS ===');
  console.log(cycle);
  console.log('Cycle Error:', cycleErr);

  // 2. Fetch Weekly Summaries
  const { data: summaries } = await supabase
    .from('weekly_summaries')
    .select('*')
    .eq('cycle_id', cycleId)
    .order('week_number', { ascending: true });

  console.log('\n=== WEEKLY SUMMARIES ===');
  summaries?.forEach(s => {
    console.log(`Week ${s.week_number}: ID=${s.id}, status=${s.status}`);
  });

  // 3. For Week 2 and Week 3, check the validation parameters
  const targetWeeks = [
    { weekNum: 2, minDay: 8, maxDay: 14 },
    { weekNum: 3, minDay: 15, maxDay: 21 }
  ];

  for (const w of targetWeeks) {
    console.log(`\n=== AUDITING VALIDATION PASS FOR WEEK ${w.weekNum} ===`);
    
    // Fetch final entry of the week
    const { data: entry } = await supabase
      .from('entries')
      .select('*')
      .eq('cycle_id', cycleId)
      .gte('cycle_day', w.minDay)
      .lte('cycle_day', w.maxDay)
      .order('cycle_day', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!entry) {
      console.log(`  No entry found in day range [${w.minDay}, ${w.maxDay}]`);
      continue;
    }

    console.log(`  Final Entry: ID=${entry.id}, cycle_day=${entry.cycle_day}`);
    console.log(`  content=${entry.content}`);
    console.log(`  has_encrypted_text=${!!entry.new_entry_text_encrypted}`);
    console.log(`  scoring_status=${entry.scoring_status}`);
    console.log(`  crisis_flag=${entry.crisis_flag}`);
    console.log(`  reflection_suppressed=${entry.reflection_suppressed}`);
    console.log(`  crisis_checked=${entry.crisis_checked}`);
    console.log(`  vocab_processed=${entry.vocab_processed}`);

    const { data: reflection } = await supabase
      .from('reflections')
      .select('*')
      .eq('entry_id', entry.id)
      .maybeSingle();

    const isScoringComplete = entry.scoring_status === 'scored';
    const isReflectionComplete = !!reflection || entry.crisis_flag || entry.reflection_suppressed;
    const isCrisisComplete = entry.crisis_checked === true;
    const isVocabComplete = entry.vocab_processed === true;

    const isCycleMetadataFinalized = cycle && (
      cycle.status?.toLowerCase() === 'archived' ||
      cycle.status?.toLowerCase() === 'completed' ||
      cycle.status?.toLowerCase() === 'complete' ||
      (cycle.current_day || 1) >= w.maxDay
    );

    console.log(`  Validation Checks:`);
    console.log(`    isScoringComplete = ${isScoringComplete} (scoring_status: ${entry.scoring_status})`);
    console.log(`    isReflectionComplete = ${isReflectionComplete} (reflection exists: ${!!reflection})`);
    console.log(`    isCrisisComplete = ${isCrisisComplete} (crisis_checked: ${entry.crisis_checked})`);
    console.log(`    isVocabComplete = ${isVocabComplete} (vocab_processed: ${entry.vocab_processed})`);
    console.log(`    isCycleMetadataFinalized = ${isCycleMetadataFinalized} (cycle status: ${cycle?.status}, current_day: ${cycle?.current_day}, maxDay: ${w.maxDay})`);
  }
}

run().catch(console.error);
