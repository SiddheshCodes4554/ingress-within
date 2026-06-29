import './load-env';
import { supabase } from '../src/lib/db';
import { decrypt } from '../src/lib/encryption';
import { extractVocabularyDeterministic, DETERMINISTIC_EMOTIONAL_WORDS } from '../src/lib/vocabEngine';

async function main() {
  console.log('=== Ingress Within: Fast Vocabulary Backfiller (Optimized) ===');
  
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

  // 1. Clear existing vocabulary data for this user
  console.log('Clearing existing vocabulary tables for user...');
  await supabase.from('vocab_words').delete().eq('user_id', userId);
  await supabase.from('vocab_clusters').delete().eq('user_id', userId);
  
  // Reset processed flags
  await supabase.from('entries').update({ vocab_processed: false }).eq('user_id', userId);
  await supabase.from('thread_responses').update({ vocab_processed: false }).eq('user_id', userId);

  // 2. Fetch all entries chronologically
  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, content, new_entry_text_encrypted, new_entry_text_iv, cycle_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error || !entries) {
    console.error('Error fetching entries:', error);
    return;
  }

  console.log(`Found ${entries.length} entries. Processing deterministically...`);

  // Group entries by cycle
  const cycleEntriesMap = new Map<string, any[]>();
  entries.forEach(e => {
    if (e.cycle_id) {
      const list = cycleEntriesMap.get(e.cycle_id) || [];
      list.push(e);
      cycleEntriesMap.set(e.cycle_id, list);
    }
  });

  for (const [cycleId, cycleEntries] of cycleEntriesMap.entries()) {
    console.log(`Processing Cycle: ${cycleId} (${cycleEntries.length} entries)`);
    
    const cycleWords = new Map<string, { word: string; frequency: number; raw_tokens: Set<string>; first_seen: string; last_seen: string }>();

    for (const entry of cycleEntries) {
      const entryText = decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv) || entry.content || '';
      if (!entryText.trim()) continue;

      const { extracted } = extractVocabularyDeterministic(entryText);

      for (const w of extracted) {
        const norm = w.normalized_word.trim().toLowerCase();
        const existing = cycleWords.get(norm);
        const entryDate = entry.created_at || new Date().toISOString();

        if (existing) {
          existing.frequency += 1;
          existing.last_seen = entryDate;
          if (w.raw_tokens) {
            w.raw_tokens.forEach(t => existing.raw_tokens.add(t));
          } else {
            existing.raw_tokens.add(w.word);
          }
        } else {
          cycleWords.set(norm, {
            word: w.word,
            frequency: 1,
            raw_tokens: new Set(w.raw_tokens || [w.word]),
            first_seen: entryDate,
            last_seen: entryDate
          });
        }
      }
    }

    // Save words to database in bulk
    console.log(`Saving ${cycleWords.size} words in bulk for cycle ${cycleId}...`);
    const wordsToInsert: any[] = [];
    for (const [norm, data] of cycleWords.entries()) {
      const isEmotional = DETERMINISTIC_EMOTIONAL_WORDS.has(norm);
      wordsToInsert.push({
        user_id: userId,
        cycle_id: cycleId,
        word: data.word,
        normalized_word: norm,
        frequency: data.frequency,
        first_seen: data.first_seen,
        last_seen: data.last_seen,
        is_emotional: isEmotional,
        emotional_score: isEmotional ? 1.0 : 0.0,
        raw_tokens: Array.from(data.raw_tokens),
        source: 'entry'
      });
    }

    if (wordsToInsert.length > 0) {
      const { error: insertErr } = await supabase.from('vocab_words').insert(wordsToInsert);
      if (insertErr) {
        console.error(`Failed to insert words in bulk:`, insertErr.message);
      }
    }
  }

  // Update entries status to processed
  await supabase.from('entries').update({ vocab_processed: true }).eq('user_id', userId);
  
  console.log('=== Fast Backfill Completed Successfully! ===');
}

main().catch(err => {
  console.error('Fatal backfiller error:', err);
});
