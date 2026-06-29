import './load-env';
import { supabase } from '../src/lib/db';

async function check() {
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
  console.log(`Checking database vocab status for user ${userId}...`);
  
  const { data: totalWords, error: err1 } = await supabase
    .from('vocab_words')
    .select('id, word, normalized_word, is_emotional, emotional_score, cycle_id, user_id')
    .eq('user_id', userId);
    
  if (err1) {
    console.error('Error fetching words:', err1);
    return;
  }
  
  console.log(`Total words for user ${userId} in vocab_words: ${totalWords?.length || 0}`);
  
  const emotionalWords = totalWords?.filter(w => w.is_emotional) || [];
  console.log(`Emotional words: ${emotionalWords.length}`);
  if (emotionalWords.length > 0) {
    console.log('Sample emotional words:', emotionalWords.slice(0, 10));
  } else {
    console.log('No emotional words found! Sample of all words:', totalWords?.slice(0, 10));
  }
}

check();
