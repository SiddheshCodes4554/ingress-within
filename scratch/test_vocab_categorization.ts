import '../src/lib/queue/load-env';
import { supabase } from '../src/lib/db';
import { processVocabularyExtraction } from '../src/lib/queue/workers/vocabWorker';
import { GET } from '../src/app/api/vocab/overview/route';
import { signJwt } from '../src/utils/crypto';
import { NextRequest } from 'next/server';

async function main() {
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
  const cycleId = 'e92a52a6-fa6a-4b7b-bcd6-0ad622e422da';
  const deviceId = 'edw8ppox4wpmqdti5uq';

  console.log('--- STARTING VOCABULARY CATEGORIZATION VERIFICATION ---');

  // 1. Create a dummy journal entry that contains emotional and theme keywords
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

  // 2. Clear out any existing vocab words for this cycle to have a clean test
  console.log('2. Clearing existing vocab words for this cycle...');
  const { error: clearErr } = await supabase
    .from('vocab_words')
    .delete()
    .eq('user_id', userId)
    .eq('cycle_id', cycleId);

  if (clearErr) {
    console.error('Failed to clear vocab words:', clearErr);
    return;
  }

  // 3. Process vocabulary extraction
  console.log('3. Running processVocabularyExtraction worker...');
  await processVocabularyExtraction({
    entry_id: entry.id,
    user_id: userId
  });

  // 4. Query vocab_words database to see if words were written and classified correctly
  console.log('4. Checking database records...');
  const { data: dbWords, error: fetchErr } = await supabase
    .from('vocab_words')
    .select('*')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId);

  if (fetchErr || !dbWords) {
    console.error('Failed to fetch vocab words:', fetchErr);
    return;
  }

  console.log(`Successfully stored ${dbWords.length} words in DB.`);
  
  // Categorize manually from query results
  const emotionalWords = dbWords.filter(w => w.is_emotional);
  const themeWords = dbWords.filter(w => !w.is_emotional && w.emotional_score > 0.0);
  const generalWords = dbWords.filter(w => !w.is_emotional && w.emotional_score === 0.0);

  console.log('\n--- DETECTED CLASSIFICATIONS IN DB ---');
  console.log('Emotional Vocabulary (is_emotional = true):', emotionalWords.map(w => `${w.normalized_word} (score: ${w.emotional_score})`));
  console.log('Personal Themes (is_emotional = false & score > 0.0):', themeWords.map(w => `${w.normalized_word} (score: ${w.emotional_score})`));
  console.log('General/Lexical Noise (is_emotional = false & score = 0.0):', generalWords.map(w => w.normalized_word));
  console.log('--------------------------------------\n');

  // Verify that anxious and sad are emotional, and work/career are themes
  const anxiousWord = dbWords.find(w => w.normalized_word === 'anxious');
  const workWord = dbWords.find(w => w.normalized_word === 'work');

  if (anxiousWord && anxiousWord.is_emotional) {
    console.log('✅ PASS: "anxious" classified as Emotional Vocabulary.');
  } else {
    console.error('❌ FAIL: "anxious" not classified as Emotional Vocabulary.', anxiousWord);
  }

  if (workWord && !workWord.is_emotional && workWord.emotional_score > 0.0) {
    console.log('✅ PASS: "work" classified as Personal Theme.');
  } else {
    console.error('❌ FAIL: "work" not classified as Personal Theme.', workWord);
  }

  // 5. Query /api/vocab/overview route
  console.log('\n5. Querying overview API endpoint...');
  const jwtSecret = process.env.JWT_SECRET || 'jwt_default_secret_dev';
  const token = signJwt({
    uid: userId,
    did: deviceId,
    phone: '1234567890'
  }, jwtSecret, 3600);

  const request = new NextRequest('http://localhost:3000/api/vocab/overview', {
    headers: {
      'authorization': `Bearer ${token}`
    }
  });

  const response = await GET(request);
  const responseData = await response.json();

  if (response.status === 200 && responseData.success) {
    console.log('✅ PASS: API endpoint returned 200 OK.');
    console.log('Overview Response Data structure checks:');
    console.log('- stats.distinctWordCount:', responseData.data?.stats?.distinctWordCount);
    console.log('- mostUsed count:', responseData.data?.mostUsed?.length);
    console.log('- personalThemes count:', responseData.data?.personalThemes?.length);
    console.log('- currentCycleThemes count:', responseData.data?.currentCycleThemes?.length);
    
    console.log('\nTop All-time Personal Themes returned by API:', responseData.data?.personalThemes?.map(w => `${w.normalized_word} (x${w.frequency})`));
    console.log('Current Cycle Personal Themes returned by API:', responseData.data?.currentCycleThemes?.map(w => `${w.normalized_word} (x${w.frequency})`));
    
    if (responseData.data?.personalThemes && responseData.data.personalThemes.length > 0) {
      console.log('🎉 SUCCESS: API correctly separates and exposes Personal Themes!');
    } else {
      console.error('❌ FAILURE: API did not return Personal Themes.');
    }
  } else {
    console.error('❌ FAILURE: API endpoint returned error status:', response.status, responseData);
  }

  // 6. Clean up dummy entry
  console.log('\n6. Cleaning up dummy journal entry...');
  await supabase.from('entries').delete().eq('id', entry.id);
  console.log('Cleanup completed.');
}

main().catch(console.error);
