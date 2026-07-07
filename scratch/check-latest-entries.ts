import './load-env';
import { supabase } from '../src/lib/db';

async function main() {
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7'; // Siddhesh
  
  console.log(`Checking latest entries and reflections for Siddhesh (${userId})...`);
  
  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, cycle_day, created_at, content, scoring_status, crisis_checked, crisis_flag, reflection_suppressed')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error("Error fetching entries:", error.message);
    return;
  }
  
  console.log(`Found ${entries?.length || 0} recent entries:`);
  for (const e of entries || []) {
    console.log(`\nEntry ID: ${e.id}`);
    console.log(`  Created At: ${e.created_at}`);
    console.log(`  Cycle Day: ${e.cycle_day}`);
    console.log(`  Scoring Status: ${e.scoring_status}`);
    console.log(`  Crisis Checked: ${e.crisis_checked}, Crisis Flag: ${e.crisis_flag}, Suppressed: ${e.reflection_suppressed}`);
    console.log(`  Content snippet: "${e.content.substring(0, 100)}..."`);
    
    // Check if reflection exists for this entry
    const { data: refl } = await supabase
      .from('reflections')
      .select('*')
      .eq('entry_id', e.id)
      .maybeSingle();
      
    if (refl) {
      console.log(`  Reflection Status: ${refl.status}`);
      console.log(`  Reflection Text: "${refl.reflection_text}"`);
    } else {
      console.log(`  Reflection Status: None (Row missing)`);
    }
  }
}

main().catch(console.error);
