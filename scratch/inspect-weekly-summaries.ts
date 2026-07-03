import './load-env';
import { supabase } from '../src/lib/db';

async function check() {
  const { data: summaries, error } = await supabase
    .from('weekly_summaries')
    .select('id, user_id, cycle_id, week_number, title, created_at, generated_at, status, report_data')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('=== INSPECTING WEEKLY SUMMARIES ===');
  summaries?.forEach((s) => {
    console.log(`ID: ${s.id}`);
    console.log(`User: ${s.user_id}`);
    console.log(`Cycle: ${s.cycle_id}`);
    console.log(`Week: ${s.week_number}`);
    console.log(`Title: ${s.title}`);
    console.log(`Status: ${s.status}`);
    console.log(`Created: ${s.created_at}`);
    console.log(`Generated: ${s.generated_at}`);
    console.log(`Crisis in report_data:`, JSON.stringify(s.report_data?.crisis_review));
    console.log('--------------------------------------------------');
  });
}

check();
