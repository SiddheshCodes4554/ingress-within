import './load-env';
import { supabase } from '../src/lib/db';

async function check() {
  console.log('Checking database vocab status for all users...');
  
  const { data: users } = await supabase.from('users').select('id, name');
  if (!users) return;

  for (const user of users) {
    const { data: totalWords, error: err1 } = await supabase
      .from('vocab_words')
      .select('id, word, normalized_word, is_emotional, emotional_score, cycle_id, user_id')
      .eq('user_id', user.id);
      
    if (err1) {
      console.error(`Error fetching words for ${user.name}:`, err1);
      continue;
    }
    
    // Fetch entries status
    const { data: entries } = await supabase
      .from('entries')
      .select('id, vocab_processed')
      .eq('user_id', user.id);

    const processed = entries?.filter(e => e.vocab_processed).length || 0;
    const unprocessed = entries?.filter(e => !e.vocab_processed).length || 0;

    console.log(`User: ${user.name} (ID: ${user.id})`);
    console.log(`  - Total words in vocab_words: ${totalWords?.length || 0}`);
    console.log(`  - Entries: ${entries?.length || 0} total (${processed} processed, ${unprocessed} unprocessed)`);
  }
}

check();
