import './load-env';
import { supabase } from '../src/lib/db';

const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
const cycleId = 'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da';

async function verify() {
  console.log('=== RUNNING DATABASE SANITY DIAGNOSTICS ===');

  // 1. Entries Count
  const { count: entriesCount, error: entriesErr } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // 2. Reflections Count
  const { count: reflectionsCount, error: reflectionsErr } = await supabase
    .from('reflections')
    .select('id', { count: 'exact', head: true })
    .eq('cycle_id', cycleId);

  // 3. Threads Count
  const { count: threadsCount, error: threadsErr } = await supabase
    .from('threads')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // 4. Thread Responses Count
  const { count: responsesCount, error: responsesErr } = await supabase
    .from('thread_responses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Print results
  console.log('--- Database Mapped Counts ---');
  console.log(`Journal Entries: ${entriesCount} (Expected: 17)`);
  console.log(`Reflections:     ${reflectionsCount} (Expected: 17)`);
  console.log(`Threads:         ${threadsCount} (Expected: 17)`);
  console.log(`Thread Responses:${responsesCount} (Expected: 17)`);

  if (entriesErr) console.error('Entries query error:', entriesErr.message);
  if (reflectionsErr) console.error('Reflections query error:', reflectionsErr.message);
  if (threadsErr) console.error('Threads query error:', threadsErr.message);
  if (responsesErr) console.error('Responses query error:', responsesErr.message);

  // Sample check on Day 1
  const { data: day1Data } = await supabase
    .from('entries')
    .select(`
      id,
      cycle_day,
      content,
      reflections!inner(reflection_text, closing_question, status, reflection_answer)
    `)
    .eq('user_id', userId)
    .eq('cycle_day', 1)
    .maybeSingle();

  console.log('--- Sample Verification (Day 1) ---');
  if (day1Data) {
    console.log(`Day 1 Entry ID:  ${day1Data.id}`);
    console.log(`Day 1 Content:   ${day1Data.content.substring(0, 50)}...`);
    const refl = Array.isArray(day1Data.reflections) ? day1Data.reflections[0] : day1Data.reflections;
    console.log(`Reflection Text: ${refl?.reflection_text.substring(0, 50)}...`);
    console.log(`Question:        ${refl?.closing_question}`);
    console.log(`Status:          ${refl?.status}`);
    console.log(`User's Answer:   ${refl?.reflection_answer}`);
  } else {
    console.log('Could not find Day 1 entry with reflection.');
  }
}

verify();
