import './load-env';
import { supabase } from '../src/lib/db';
import { processVocabularyExtraction } from '../src/lib/queue/workers/vocabWorker';

async function main() {
  console.log('=== Ingress Within: Refined Vocabulary Reprocessor ===');
  
  // 1. Reset database tables
  console.log('Clearing existing vocabulary tables...');
  
  // Delete all rows in vocab tables
  const { error: delWordsErr } = await supabase.from('vocab_words').delete().filter('id', 'neq', '00000000-0000-0000-0000-000000000000');
  const { error: delConceptsErr } = await supabase.from('vocab_concepts').delete().filter('id', 'neq', '00000000-0000-0000-0000-000000000000');
  const { error: delClustersErr } = await supabase.from('vocab_clusters').delete().filter('id', 'neq', '00000000-0000-0000-0000-000000000000');

  if (delWordsErr || delConceptsErr || delClustersErr) {
    console.error('Failed to clear tables:', { delWordsErr, delConceptsErr, delClustersErr });
    return;
  }

  // Reset processed flags
  await supabase.from('entries').update({ vocab_processed: false }).filter('id', 'neq', '00000000-0000-0000-0000-000000000000');
  await supabase.from('thread_responses').update({ vocab_processed: false }).filter('id', 'neq', '00000000-0000-0000-0000-000000000000');

  console.log('Vocabulary tables cleared successfully.');

  // 2. Fetch all entries chronologically
  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, user_id')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching entries:', error);
    return;
  }

  console.log(`Found ${entries.length} entries to process. Beginning sequential ingestion...`);

  // 3. Process entries sequentially
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    console.log(`[${i + 1}/${entries.length}] Processing entry: ${entry.id}`);
    try {
      await processVocabularyExtraction({
        entry_id: entry.id,
        user_id: entry.user_id
      });
    } catch (err) {
      console.error(`Failed to process entry ${entry.id}:`, err);
    }
  }

  console.log('=== Reprocessing completed successfully! ===');
}

main().catch(err => {
  console.error('Fatal reprocessor error:', err);
});
