import './load-env';
import { backfillWeeklyReports } from '../src/lib/weeklyReportBackfill';
import { collectWeeklyReportData } from '../src/lib/weeklyReportCollector';

const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
const cycleId = 'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da';

async function testCollectorAndBackfill() {
  console.log('=== TESTING WEEKLY REPORT DATA COLLECTOR ===');
  try {
    const data = await collectWeeklyReportData({
      userId,
      cycleId,
      weekNumber: 1,
      dayStart: 1,
      dayEnd: 7
    });

    console.log('Data collection successful!');
    console.log(`- Entries: ${data.entries.length} completed`);
    console.log(`- Entries JSON length: ${JSON.stringify(data.entries).length} chars`);
    console.log(`- Thread responses JSON length: ${JSON.stringify(data.threadResponses).length} chars`);
    console.log(`- Vocab expressions this week: ${data.vocabThisWeek.length}`);
    console.log(`- Vocab JSON length: ${JSON.stringify(data.vocabThisWeek).length} chars`);
    console.log(`- Open threads JSON length: ${JSON.stringify(data.openThreads).length} chars`);
    console.log(`- Personality Context length: ${(data.personalityContext || '').length} chars`);
    console.log(`- Total Weekly Data JSON length: ${JSON.stringify(data).length} chars`);
    console.log(`- Word count details:`, data.writing_behaviour.entry_lengths);
    console.log(`- Week range calculated: ${data.weekly_stats.week_range}`);
  } catch (err: any) {
    console.error('Collector failed:', err.message || err);
  }

  console.log('\n=== TESTING BACKFILL ORCHESTRATOR ===');
  try {
    const result = await backfillWeeklyReports(userId);
    console.log('Backfill scan completed successfully:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error('Backfill orchestrator failed:', err.message || err);
  }
}

testCollectorAndBackfill();
