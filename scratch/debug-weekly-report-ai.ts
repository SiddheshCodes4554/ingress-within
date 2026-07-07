import fs from 'fs';
import path from 'path';

// Load environment variables synchronously first
try {
  const envContent = fs.readFileSync('D:/Internship/Ingress Within/.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
} catch (e: any) {
  console.error('Could not load .env file:', e.message);
}

async function main() {
  // Dynamically import to avoid hoisted execution before process.env is ready
  const { supabase } = await import('../src/lib/db');
  const { collectWeeklyReportData } = await import('../src/lib/weeklyReportCollector');
  const { aiProvider } = await import('../src/lib/ai/factory');

  const ai = aiProvider as any;

  const summaryId = '29c966ca-f29b-4749-a2b7-3315bd86d6b8';
  
  // Fetch summary details
  const { data: summary } = await supabase
    .from('weekly_summaries')
    .select('*')
    .eq('id', summaryId)
    .single();

  if (!summary) {
    console.error('Summary not found');
    return;
  }

  console.log('Collecting weekly data...');
  const collectedData = await collectWeeklyReportData({
    userId: summary.user_id,
    cycleId: summary.cycle_id,
    weekNumber: summary.week_number,
    dayStart: summary.day_start,
    dayEnd: summary.day_end
  });

  console.log('Calling AI provider...');
  try {
    const formattedEntries = collectedData.entries.map(e => `Journal Entry:\n"${e.content}"`).join('\n\n');
    const topWords = collectedData.vocabThisWeek.slice(0, 3).map(w => `"${w.word}" (frequency: ${w.frequency})`).join(', ');
    const skippedDaysInfo = collectedData.weekly_stats.skipped_days > 0 
      ? `Days skipped: ${collectedData.weekly_stats.skipped_day_numbers.map(d => `Day ${d}`).join(', ')}`
      : 'Days skipped: None';
    const lastWeekInfo = collectedData.lastWeekTopExpressions 
      ? `Last week's top expressions: ${collectedData.lastWeekTopExpressions.map(w => `"${w}"`).join(', ')}`
      : "Last week's top expressions: null (this is week 1)";

    const userContent = `User Weekly Data:
- Entries written this week:
${formattedEntries}

- Top most-used words/phrases this week:
${topWords || 'None'}

- Skipped Days:
${skippedDaysInfo}

- Previous week top expressions:
${lastWeekInfo}`;

    console.log('--- User Content ---');
    console.log(userContent);
    
    // Call the actual method
    const result = await ai.generateWeeklyReport(collectedData);
    
    console.log('--- Raw Response ---');
    console.log(ai.lastRawResponse);
    
    console.dir(result, { depth: null });
  } catch (err) {
    console.error('AI call failed:', err);
  }
}

main().catch(console.error);
