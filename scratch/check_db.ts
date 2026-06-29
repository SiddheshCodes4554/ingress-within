import '../src/lib/queue/load-env';
import { supabase } from '../src/lib/db';

async function check() {
  console.log('--- Checking vocab_words table ---');
  try {
    const { data, error } = await supabase.from('vocab_words').select('*').limit(1);
    if (error) {
      console.error('Error fetching vocab_words:', error);
    } else {
      console.log('vocab_words row structure:', data);
    }
  } catch (err) {
    console.error('Exception check vocab_words:', err);
  }

  console.log('--- Checking vocab_clusters table ---');
  try {
    const { data, error } = await supabase.from('vocab_clusters').select('*').limit(1);
    if (error) {
      console.error('Error fetching vocab_clusters:', error);
    } else {
      console.log('vocab_clusters row structure:', data);
    }
  } catch (err) {
    console.error('Exception check vocab_clusters:', err);
  }

  console.log('--- Checking vocab_concepts table ---');
  try {
    const { data, error } = await supabase.from('vocab_concepts').select('*').limit(1);
    if (error) {
      console.error('Error fetching vocab_concepts:', error);
    } else {
      console.log('vocab_concepts row structure:', data);
    }
  } catch (err) {
    console.error('Exception check vocab_concepts:', err);
  }
}

check();
