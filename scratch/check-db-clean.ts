import './env-loader';
import { supabase } from '../src/lib/db';

async function run() {
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

  console.log(`=== CHECKING CURRENT DB STATUS FOR USER ${userId} ===`);

  const { data: cycles } = await supabase.from('cycles').select('*').eq('user_id', userId);
  console.log(`Cycles:`, cycles?.map(c => ({ id: c.id, num: c.cycle_number || c.number, status: c.status, start: c.start_date || c.started_at })));

  const { data: entries } = await supabase.from('entries').select('id, cycle_id, cycle_day, written_at').eq('user_id', userId);
  console.log(`Entries count:`, entries?.length);
  const byCycle: Record<string, number> = {};
  entries?.forEach(e => {
    byCycle[e.cycle_id] = (byCycle[e.cycle_id] || 0) + 1;
  });
  console.log(`Entries by cycle ID:`, byCycle);

  const { data: ws } = await supabase.from('weekly_summaries').select('id, cycle_id, week_number, status').eq('user_id', userId);
  console.log(`Weekly summaries:`, ws?.map(w => ({ id: w.id, cycle_id: w.cycle_id, week: w.week_number, status: w.status })));

  const { data: snapshots } = await supabase.from('pattern_snapshots').select('id, cycle_id, cycle_number, snapshot_status').eq('user_id', userId);
  console.log(`Pattern snapshots:`, snapshots?.map(s => ({ id: s.id, cycle_id: s.cycle_id, num: s.cycle_number, status: s.snapshot_status })));

  const { data: assessments } = await supabase.from('assessments').select('id, cycle_id, generation_status').eq('user_id', userId);
  console.log(`Assessments:`, assessments?.map(a => ({ id: a.id, cycle_id: a.cycle_id, status: a.generation_status })));
}

run();
