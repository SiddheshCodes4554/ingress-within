import './load-env';
import { supabase } from '../src/lib/db';
import { overlayWeeklyReportGraphData } from '../src/lib/reportGraphHelper';

const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

async function test() {
  console.log('=== TESTING WEEKLY REPORT GRAPH DATA WITH DYNAMIC OVERLAY ===');

  // 1. Fetch weekly summaries directly
  const { data: rawSummaries, error } = await supabase
    .from('weekly_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('week_number', { ascending: true });

  if (error) {
    console.error('Error fetching summaries:', error.message);
    return;
  }

  if (!rawSummaries || rawSummaries.length === 0) {
    console.log('No weekly summaries found in database.');
    return;
  }

  console.log(`Found ${rawSummaries.length} weekly summaries.`);

  for (const rawSummary of rawSummaries) {
    // Pass raw database summary through the API overlay helper
    const summary = await overlayWeeklyReportGraphData(rawSummary, userId);

    console.log(`\n--- Week ${summary.week_number} (Summary ID: ${summary.id}) ---`);
    console.log(`Status:       ${summary.status}`);
    const reportData = summary.report_data || {};
    const writingBehavior = reportData.writing_behaviour || {};
    console.log(`Entry Lengths (Heights):`, writingBehavior.entry_lengths);
    console.log(`Trend Interpretation:   `, writingBehavior.consistency);
  }
}

test();
