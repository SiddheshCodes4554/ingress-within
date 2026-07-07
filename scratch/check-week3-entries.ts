import './load-env';
import { supabase } from '../src/lib/db';

async function main() {
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
  const cycleId = '69d4b73b-f212-47be-a2d4-5ab965e12829';
  
  console.log(`Checking Week 3 entries (days 15-21) for Siddhesh...`);
  
  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, cycle_day, created_at, entry_type, scoring_status, crisis_checked, vocab_processed')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId)
    .gte('cycle_day', 15)
    .lte('cycle_day', 21)
    .order('cycle_day', { ascending: true });
    
  if (error) {
    console.error("Error fetching entries:", error.message);
    return;
  }
  
  console.log(`Found ${entries?.length || 0} entries for Week 3:`);
  for (const e of entries || []) {
    console.log(`  - Day: ${e.cycle_day}, ID: ${e.id}, Type: ${e.entry_type}, Scoring: ${e.scoring_status}, Crisis: ${e.crisis_checked}, Vocab: ${e.vocab_processed}`);
  }
}

main().catch(console.error);
