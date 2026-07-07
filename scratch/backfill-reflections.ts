import './load-env';
import { supabase } from '../src/lib/db';
import { processReflectionGeneration } from '../src/lib/queue/workers/reflectionWorker';

async function main() {
  console.log("Starting global reflections backfill process...");
  
  // 1. Fetch all real entries (entry_type !== 'empty')
  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, user_id, entry_type, created_at')
    .neq('entry_type', 'empty');
    
  if (error) {
    console.error("Error fetching entries:", error.message);
    return;
  }
  
  console.log(`Found ${entries?.length || 0} real journal entries total.`);
  
  // 2. Fetch all existing reflections to see which ones are ready/completed
  const { data: reflections } = await supabase
    .from('reflections')
    .select('entry_id, status');
    
  const existingReflectionEntries = new Set(
    (reflections || [])
      .filter(r => r.status === 'ready' || r.status === 'completed')
      .map(r => r.entry_id)
  );
  
  // 3. Find entries missing reflections
  const missingEntries = entries.filter(e => !existingReflectionEntries.has(e.id));
  console.log(`Found ${missingEntries.length} entries missing a valid reflection.`);
  
  // 4. Process each missing entry using the fast local fallback
  let count = 0;
  for (const entry of missingEntries) {
    count++;
    console.log(`[${count}/${missingEntries.length}] Backfilling reflection for entry ${entry.id} (user: ${entry.user_id})`);
    try {
      await processReflectionGeneration({
        entry_id: entry.id,
        user_id: entry.user_id,
        bypass_ai: true // Use fast local reflection generator to avoid rate limits/timeouts
      });
    } catch (err: any) {
      console.error(`Failed to generate reflection for entry ${entry.id}:`, err.message || err);
    }
  }
  
  console.log(`Reflections backfill complete! Processed ${count} entries.`);
}

main().catch(console.error);
