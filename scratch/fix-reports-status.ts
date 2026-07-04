import './load-env';
import { supabase } from '../src/lib/db';

async function run() {
  const ids = [
    '18205cb1-381d-4d36-9d53-bc62b2e1bf53', // Week 2
    '1afffa32-4a13-4c16-8e11-035f56dedafa'  // Week 3
  ];

  console.log('Updating statuses of generated reports...');

  for (const id of ids) {
    const { data: summary } = await supabase
      .from('weekly_summaries')
      .select('*')
      .eq('id', id)
      .single();

    if (summary) {
      const orchestration = summary.report_data?.orchestration || {};
      orchestration.status = 'READY';
      orchestration.completed_at = orchestration.completed_at || new Date().toISOString();

      const reportData = {
        ...summary.report_data,
        orchestration
      };

      const { data, error } = await supabase
        .from('weekly_summaries')
        .update({
          status: 'READY',
          report_data: reportData
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error(`Failed to update summary ${id}:`, error.message);
      } else {
        console.log(`Successfully updated summary ${id} to READY.`);
      }
    } else {
      console.log(`Summary ${id} not found.`);
    }
  }
}

run().catch(console.error);
