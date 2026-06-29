import './load-env';
import { supabase } from '../src/lib/db';
import { rebuildUserVocabulary } from '../src/lib/vocab/rebuildService';
import { processVocabularyExtraction } from '../src/lib/queue/workers/vocabWorker';

async function main() {
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
  const cycleId = 'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da';

  console.log('=== STARTING PRODUCTION VOCABULARY ENGINE VERIFICATION (v7) ===');

  // 1. Check if there are entries to process
  const { data: entries } = await supabase
    .from('entries')
    .select('id')
    .eq('user_id', userId)
    .limit(3);

  if (!entries || entries.length === 0) {
    console.log('No entries found for user! Inserting one dummy entry first...');
    const entryText = "I woke up feeling heavy and sad. I had a lot of work tasks at the office and felt pressure about my career project, but I hope to establish better boundaries and support my growth.";
    const { data: dummyEntry } = await supabase
      .from('entries')
      .insert({
        user_id: userId,
        cycle_id: cycleId,
        content: entryText,
        word_count: entryText.split(/\s+/).length,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();
    console.log(`Dummy entry inserted: ${dummyEntry?.id}`);
  }

  // 2. Perform a complete history rebuild
  console.log('2. Running rebuildUserVocabulary service...');
  const rebuildResult = await rebuildUserVocabulary(userId);
  console.log('Rebuild result:', JSON.stringify(rebuildResult, null, 2));

  // 3. Query vocab_extractions (the granular audit trail)
  console.log('3. Fetching vocab_extractions audit trail...');
  const { data: extractions, error: extErr } = await supabase
    .from('vocab_extractions')
    .select('*')
    .eq('user_id', userId)
    .limit(5);

  if (extErr) {
    console.error('Failed to fetch vocab_extractions:', extErr.message);
  } else {
    console.log(`Total vocab_extractions fetched: ${extractions?.length || 0}`);
    console.log('Sample audit records:', JSON.stringify(extractions, null, 2));
  }

  // 4. Query vocab_words (aggregated precomputed counts)
  console.log('4. Fetching vocab_words...');
  const { data: words, error: wordsErr } = await supabase
    .from('vocab_words')
    .select('*')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId);

  if (wordsErr) {
    console.error('Failed to fetch vocab_words:', wordsErr.message);
  } else {
    console.log(`Total vocab_words: ${words?.length || 0}`);
    console.log('Precomputed words:', JSON.stringify(words?.slice(0, 5), null, 2));
  }

  // 5. Query vocab_clusters (personalized grouping)
  console.log('5. Fetching vocab_clusters...');
  const { data: clusters, error: clustersErr } = await supabase
    .from('vocab_clusters')
    .select('*')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId);

  if (clustersErr) {
    console.error('Failed to fetch vocab_clusters:', clustersErr.message);
  } else {
    console.log(`Total vocab_clusters: ${clusters?.length || 0}`);
    console.log('Dynamic Clusters:', JSON.stringify(clusters, null, 2));
  }

  console.log('=== VERIFICATION OF V7 ENGINE COMPLETE ===');
}

main().catch(console.error);
