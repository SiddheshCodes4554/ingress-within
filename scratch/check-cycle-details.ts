import './load-env';
import { supabase } from '../src/lib/db';

async function main() {
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7'; // Siddhesh
  
  console.log(`Checking cycle details for Siddhesh (${userId})...`);
  
  const { data: cycles, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', userId);
    
  if (error) {
    console.error("Error fetching cycles:", error.message);
    return;
  }
  
  console.log(`Found ${cycles?.length || 0} cycles:`);
  for (const c of cycles || []) {
    console.log(`\nCycle ID: ${c.id}`);
    console.log(`  Cycle Number: ${c.cycle_number}`);
    console.log(`  Status: ${c.status}`);
    console.log(`  Current Day: ${c.current_day}`);
    console.log(`  Start Date: ${c.start_date}`);
  }
}

main().catch(console.error);
