import './load-env';
import { supabase } from '../src/lib/db';

async function check() {
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
  
  // 1. Fetch user cycles
  const { data: cycles } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', userId);
  
  console.log('--- User Cycles ---');
  console.log(JSON.stringify(cycles, null, 2));

  // 2. Fetch user entries around June 30 - July 3
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log('\n--- User Entries ---');
  entries?.forEach(e => {
    console.log(`ID: ${e.id}, cycle_id: ${e.cycle_id}, cycle_day: ${e.cycle_day}, created_at: ${e.created_at}, crisis_flag: ${e.crisis_flag}, crisis_type: ${e.crisis_type}`);
  });

  // 3. Fetch user crisis logs
  const { data: crisisLogs } = await supabase
    .from('crisis_log')
    .select('*')
    .eq('user_id', userId);

  console.log('\n--- User Crisis Logs ---');
  console.log(JSON.stringify(crisisLogs, null, 2));

  // 4. Fetch the Week 3 summary
  const { data: summary } = await supabase
    .from('weekly_summaries')
    .select('*')
    .eq('user_id', userId)
    .eq('week_number', 3)
    .single();

  console.log('\n--- Week 3 Summary ---');
  console.log(JSON.stringify(summary, null, 2));
}

check().catch(console.error);
