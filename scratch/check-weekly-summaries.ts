import './load-env';
import { supabase } from '../src/lib/db';

async function main() {
  console.log("Checking weekly_summaries table in database...");
  
  const { data: summaries, error } = await supabase
    .from('weekly_summaries')
    .select('id, user_id, cycle_id, week_number, status, title, generated_at, report_data');
    
  if (error) {
    console.error("Error fetching weekly summaries:", error.message);
    return;
  }
  
  console.log(`Total weekly summaries found: ${summaries?.length || 0}`);
  
  // Group by user and status
  const { data: users } = await supabase.from('profiles').select('id, display_name');
  const userIdToName = new Map(users?.map(u => [u.id, u.display_name]) || []);
  
  const userSummaries: Record<string, any[]> = {};
  for (const s of summaries || []) {
    const userName = userIdToName.get(s.user_id) || s.user_id;
    if (!userSummaries[userName]) {
      userSummaries[userName] = [];
    }
    userSummaries[userName].push(s);
  }
  
  for (const [name, refs] of Object.entries(userSummaries)) {
    console.log(`\nUser: ${name}`);
    console.log(`  - Total summaries: ${refs.length}`);
    console.log(`  - READY: ${refs.filter(r => r.status === 'READY').length}`);
    console.log(`  - WAITING_FOR_PROCESSING: ${refs.filter(r => r.status === 'WAITING_FOR_PROCESSING').length}`);
    console.log(`  - PROCESSING/GENERATING: ${refs.filter(r => r.status === 'PROCESSING' || r.status === 'GENERATING').length}`);
    console.log(`  - FAILED: ${refs.filter(r => r.status === 'FAILED').length}`);
    
    console.log("  - Summaries list:");
    refs.forEach(r => {
      console.log(`    * Week: ${r.week_number}, Status: ${r.status}, Title: "${r.title}", Generated: ${r.generated_at}`);
      const data = r.report_data || {};
      const hasWhatWeSaw = !!data.what_we_saw;
      const hasTone = !!data.week_tone;
      const hasStats = !!data.weekly_stats;
      const hasVocab = !!data.vocabThisWeek;
      console.log(`      Content check: hasWhatWeSaw=${hasWhatWeSaw}, hasTone=${hasTone}, hasStats=${hasStats}, hasVocab=${hasVocab}`);
    });
  }
}

main().catch(console.error);
