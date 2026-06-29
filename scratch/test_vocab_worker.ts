import '../src/lib/queue/load-env';
import { supabase } from '../src/lib/db';
import { processVocabularyExtraction } from '../src/lib/queue/workers/vocabWorker';

async function main() {
  const entryId = '1e04b68d-55ba-4c5a-be79-8bb068388b2d'; // One of the processed entries
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

  console.log(`Setting vocab_processed = false for entry ${entryId} to re-run processing...`);
  await supabase
    .from('entries')
    .update({ vocab_processed: false })
    .eq('id', entryId);

  console.log('Running processVocabularyExtraction...');
  await processVocabularyExtraction({
    entry_id: entryId,
    user_id: userId
  });

  console.log('Done running processVocabularyExtraction.');
}

main().catch(console.error);
