import './load-env';
import { supabase } from '../src/lib/db';
import { weeklyReportOrchestrator } from '../src/lib/weeklyReportOrchestrator';

async function main() {
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
  const cycleId = '69d4b73b-f212-47be-a2d4-5ab965e12829';
  const weekNumber = 3;
  const summaryId = '30000000-0000-4000-a000-000000000003'; // Week 3 summary ID? Wait, let's query it first.
  
  const { data: summary } = await supabase
    .from('weekly_summaries')
    .select('id')
    .eq('cycle_id', cycleId)
    .eq('week_number', weekNumber)
    .single();
    
  if (!summary) {
    console.error("Week 3 summary not found!");
    return;
  }
  
  console.log(`Running weekly report validation and generation for summary ${summary.id}...`);
  await weeklyReportOrchestrator.validateAndGenerateReport(summary.id, userId, cycleId, weekNumber);
  console.log("Validation/generation run completed.");
}

main().catch(console.error);
