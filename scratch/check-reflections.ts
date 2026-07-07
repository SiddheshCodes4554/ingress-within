import './load-env';
import { supabase } from '../src/lib/db';

async function checkReflections() {
  console.log("Checking reflections table in database...");
  
  const { data: reflections, error } = await supabase
    .from('reflections')
    .select('id, entry_id, user_id, status, reflection_text, closing_question, generated_at');
    
  if (error) {
    console.error("Error fetching reflections:", error.message);
    return;
  }
  
  console.log(`Total reflections found: ${reflections?.length || 0}`);
  
  // Group by status
  const statusCounts: Record<string, number> = {};
  for (const ref of reflections || []) {
    statusCounts[ref.status] = (statusCounts[ref.status] || 0) + 1;
  }
  console.log("Reflection status counts:", statusCounts);
  
  // Group by user
  const { data: users } = await supabase.from('profiles').select('id, display_name');
  const userIdToName = new Map(users?.map(u => [u.id, u.display_name]) || []);
  
  const userReflections: Record<string, any[]> = {};
  for (const ref of reflections || []) {
    const userName = userIdToName.get(ref.user_id) || ref.user_id;
    if (!userReflections[userName]) {
      userReflections[userName] = [];
    }
    userReflections[userName].push(ref);
  }
  
  for (const [name, refs] of Object.entries(userReflections)) {
    console.log(`\nUser: ${name}`);
    console.log(`  - Total reflections: ${refs.length}`);
    console.log(`  - Ready: ${refs.filter(r => r.status === 'ready').length}`);
    console.log(`  - Pending: ${refs.filter(r => r.status === 'pending').length}`);
    console.log(`  - Failed: ${refs.filter(r => r.status === 'failed').length}`);
    
    if (refs.filter(r => r.status === 'pending' || r.status === 'failed').length > 0) {
      console.log("  - Sample pending/failed reflections:");
      refs.filter(r => r.status !== 'ready').slice(0, 3).forEach(r => {
        console.log(`    * Entry ID: ${r.entry_id}, Status: ${r.status}, Generated: ${r.generated_at}`);
        console.log(`      Text: "${r.reflection_text}"`);
      });
    }
  }
}

checkReflections().catch(console.error);
