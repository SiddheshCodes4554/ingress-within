import fs from 'fs';
import path from 'path';

// Parse .env BEFORE importing anything else
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
} catch (e: any) {
  console.error('Could not read .env file:', e.message);
}

process.env.BYPASS_REDIS = 'true'; // Enable inline processing

async function runInspect() {
  // Dynamic imports after env is loaded
  const { createClient } = await import('@supabase/supabase-js');
  const { processEntryScoring } = await import('../src/lib/queue/workers/entryScoringWorker');
  const { processCrisisDetection } = await import('../src/lib/queue/workers/crisisDetectionWorker');
  const { processReflectionGeneration } = await import('../src/lib/queue/workers/reflectionWorker');
  const { processVocabularyExtraction } = await import('../src/lib/queue/workers/vocabWorker');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Fetching a user...');
  const { data: users } = await supabase.from('users').select('id').limit(1);
  const userId = users?.[0]?.id;
  if (!userId) {
    console.error('No users found in database.');
    return;
  }
  console.log(`Using user ID: ${userId}`);

  // Fetch or create cycle
  let { data: cycle } = await supabase
    .from('cycles')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!cycle) {
    const { data: newCycle } = await supabase
      .from('cycles')
      .insert({ user_id: userId, status: 'active', started_at: new Date().toISOString() })
      .select()
      .single();
    cycle = newCycle;
  }

  console.log(`Using cycle ID: ${cycle?.id}`);

  // Create entry
  const entryText = "I feel so tired and exhausted from work today. Everything is fine but I am depleted.";
  const { data: entry, error: insertError } = await supabase
    .from('entries')
    .insert({
      user_id: userId,
      cycle_id: cycle?.id,
      cycle_day: 10,
      content: entryText,
      new_entry_text_encrypted: entryText,
      entry_type: 'both',
      word_count: entryText.split(' ').length,
      written_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError || !entry) {
    console.error('Failed to insert entry:', insertError);
    return;
  }

  const entryId = entry.id;
  console.log(`Created test entry ID: ${entryId}`);

  try {
    console.log('Running processEntryScoring...');
    await processEntryScoring({ entry_id: entryId, user_id: userId });
    console.log('processEntryScoring completed.');

    console.log('Fetching entry_scores...');
    const { data: score } = await supabase.from('entry_scores').select('*').eq('entry_id', entryId).maybeSingle();
    console.log('Entry Score:', score);

    console.log('Fetching reflection...');
    const { data: reflection } = await supabase.from('reflections').select('*').eq('entry_id', entryId).maybeSingle();
    console.log('Reflection:', reflection);

    console.log('Fetching vocab_words...');
    const { data: vocab } = await supabase.from('vocab_words').select('*').eq('user_id', userId).eq('cycle_id', cycle?.id);
    console.log('Vocab Words in DB:', vocab);

    console.log('Fetching vocab_clusters...');
    const { data: clusters } = await supabase.from('vocab_clusters').select('*').eq('user_id', userId).eq('cycle_id', cycle?.id);
    console.log('Clusters in DB:', clusters);

  } catch (err: any) {
    console.error('Error running worker chain:', err.message, err.stack);
  }
}

runInspect();
