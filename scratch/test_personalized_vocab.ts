import './load-env';
import { supabase } from '../src/lib/db';
import { processVocabularyExtraction } from '../src/lib/queue/workers/vocabWorker';
import { GET } from '../src/app/api/vocab/overview/route';
import { signJwt } from '../src/utils/crypto';
import { NextRequest } from 'next/server';

async function main() {
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
  const cycleId = 'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da';

  console.log('=== STARTING PERSONALIZED VOCABULARY ENGINE VERIFICATION ===');

  // 1. Create a dummy journal entry with rich emotional content
  console.log('1. Inserting dummy journal entry...');
  const entryText = "I felt very anxious and sad this morning. I had a lot of work tasks at the office and felt pressure about my career project. I need to establish better boundaries and habits to support my growth.";
  
  const { data: entry, error: insertEntryErr } = await supabase
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

  if (insertEntryErr || !entry) {
    console.error('Failed to create dummy entry:', insertEntryErr);
    return;
  }

  console.log(`Dummy entry created with ID: ${entry.id}`);

  // 2. Clear out any existing vocab words and clusters for this cycle
  console.log('2. Clearing existing vocab words and clusters...');
  await supabase
    .from('vocab_words')
    .delete()
    .eq('user_id', userId)
    .eq('cycle_id', cycleId);

  await supabase
    .from('vocab_clusters')
    .delete()
    .eq('user_id', userId)
    .eq('cycle_id', cycleId);

  // 3. Process vocabulary extraction (AI-powered personalized extraction)
  console.log('3. Running processVocabularyExtraction worker...');
  await processVocabularyExtraction({
    entry_id: entry.id,
    user_id: userId
  });

  // 4. Query vocab_words database to see if words were written with semantic meanings
  console.log('4. Checking vocab_words database records...');
  const { data: dbWords, error: fetchErr } = await supabase
    .from('vocab_words')
    .select('*')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId);

  if (fetchErr || !dbWords) {
    console.error('Failed to fetch vocab words:', fetchErr);
    return;
  }

  console.log(`Stored ${dbWords.length} words in DB.`);
  console.log(JSON.stringify(dbWords, null, 2));

  // 5. Query vocab_clusters to check dynamic clusters
  console.log('5. Checking vocab_clusters database records...');
  const { data: dbClusters, error: fetchClustErr } = await supabase
    .from('vocab_clusters')
    .select('*')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId);

  if (fetchClustErr || !dbClusters) {
    console.error('Failed to fetch vocab clusters:', fetchClustErr);
    return;
  }

  console.log(`Stored ${dbClusters.length} clusters in DB.`);
  console.log(JSON.stringify(dbClusters, null, 2));

  // 6. Query /api/vocab/overview route
  console.log('6. Requesting /api/vocab/overview route payload...');
  const jwtSecret = process.env.JWT_SECRET || 'jwt_default_secret_dev';
  const deviceId = 'edw8ppox4wpmqdti5uq';
  const token = signJwt({
    uid: userId,
    did: deviceId,
    phone: '1234567890'
  }, jwtSecret, 3600);

  const req = new NextRequest('http://localhost:3000/api/vocab/overview', {
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  const response = await GET(req);
  const json = await response.json();

  if (!json.success) {
    console.error('API request failed:', json);
    return;
  }

  console.log('\n=== PERSONAL VOCABULARY LANDSCAPE PAYLOAD ===');
  console.log('Stats:', JSON.stringify(json.data.stats, null, 2));
  console.log('Emerging:', JSON.stringify(json.data.emerging, null, 2));
  console.log('Dynamic Clusters:', JSON.stringify(json.data.clusters, null, 2));
  console.log('=============================================\n');

  // 7. Clean up dummy entry
  console.log('7. Cleaning up dummy journal entry...');
  await supabase.from('entries').delete().eq('id', entry.id);
  console.log('Cleanup completed.');

  console.log('🎉 VERIFICATION COMPLETED SUCCESSFULLY!');
}

main().catch(console.error);
