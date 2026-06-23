import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';

export async function processVocabularyExtraction(jobData: {
  entry_id: string;
  user_id: string;
}) {
  const { entry_id, user_id } = jobData;

  console.log(`[Vocab Worker] Processing vocabulary for entry ${entry_id} (user ${user_id})`);

  // 1. Fetch the entry
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entry_id)
    .single();

  if (entryError || !entry) {
    throw new Error(`Failed to fetch entry ${entry_id}: ${entryError?.message || 'Not found'}`);
  }

  // 2. Decrypt entry text
  const entryText = decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv) || entry.content;

  if (!entryText || entryText.trim() === '') {
    console.log(`[Vocab Worker] Entry ${entry_id} has empty text. Skipping vocabulary extraction.`);
    return;
  }

  try {
    // 3. Extract Vocabulary using AI
    console.log(`[Vocab Worker] Extracting emotional vocabulary from entry text...`);
    const extractResult = await aiProvider.extractVocabulary(entryText);

    if (!extractResult.words || !Array.isArray(extractResult.words) || extractResult.words.length === 0) {
      console.log(`[Vocab Worker] No emotional vocabulary words extracted.`);
      return;
    }

    console.log(`[Vocab Worker] Extracted ${extractResult.words.length} words:`, JSON.stringify(extractResult.words));

    // 4. Update vocab_words table (deterministic frequency accumulation)
    for (const w of extractResult.words) {
      if (!w.word || !w.normalized_word) continue;
      const cleanWord = w.word.trim().toLowerCase();
      const cleanNormWord = w.normalized_word.trim().toLowerCase();

      // Check if word already exists in this cycle for the user
      const { data: existingWord, error: queryErr } = await supabase
        .from('vocab_words')
        .select('id, frequency')
        .eq('user_id', user_id)
        .eq('cycle_id', entry.cycle_id)
        .eq('normalized_word', cleanNormWord)
        .maybeSingle();

      if (queryErr) {
        console.error(`[Vocab Worker] Error querying existing word:`, queryErr.message);
        continue;
      }

      if (existingWord) {
        // Increment frequency count
        const { error: updateErr } = await supabase
          .from('vocab_words')
          .update({
            frequency: existingWord.frequency + 1,
            last_seen: new Date().toISOString()
          })
          .eq('id', existingWord.id);

        if (updateErr) {
          console.error(`[Vocab Worker] Failed to update frequency for word "${cleanNormWord}":`, updateErr.message);
        } else {
          console.log(`[Vocab Worker] Incremented frequency for word "${cleanNormWord}" to ${existingWord.frequency + 1}`);
        }
      } else {
        // Insert new word record
        const { error: insertErr } = await supabase
          .from('vocab_words')
          .insert({
            user_id,
            cycle_id: entry.cycle_id,
            word: cleanWord,
            normalized_word: cleanNormWord,
            frequency: 1,
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString()
          });

        if (insertErr) {
          console.error(`[Vocab Worker] Failed to insert new word "${cleanNormWord}":`, insertErr.message);
        } else {
          console.log(`[Vocab Worker] Inserted new vocabulary word "${cleanNormWord}"`);
        }
      }
    }

    // 5. Update clusters (AI grouping, deterministic stats)
    console.log(`[Vocab Worker] Fetching all vocabulary words for user in cycle ${entry.cycle_id}...`);
    const { data: allCycleWords, error: fetchWordsErr } = await supabase
      .from('vocab_words')
      .select('word, normalized_word, frequency')
      .eq('user_id', user_id)
      .eq('cycle_id', entry.cycle_id);

    if (fetchWordsErr) {
      throw new Error(`Failed to fetch cycle words for clustering: ${fetchWordsErr.message}`);
    }

    if (!allCycleWords || allCycleWords.length === 0) {
      console.log(`[Vocab Worker] No cycle words found for clustering.`);
      return;
    }

    console.log(`[Vocab Worker] Grouping ${allCycleWords.length} active words into thematic clusters...`);
    const clusterResult = await aiProvider.groupClusters(allCycleWords);

    if (clusterResult.clusters && Array.isArray(clusterResult.clusters)) {
      console.log(`[Vocab Worker] AI grouped words into ${clusterResult.clusters.length} clusters.`);

      // Delete existing clusters for this user and cycle
      const { error: deleteClustersErr } = await supabase
        .from('vocab_clusters')
        .delete()
        .eq('user_id', user_id)
        .eq('cycle_id', entry.cycle_id);

      if (deleteClustersErr) {
        console.error(`[Vocab Worker] Failed to delete existing clusters:`, deleteClustersErr.message);
      }

      // Re-create clusters and update vocab_words links
      for (const cl of clusterResult.clusters) {
        if (!cl.cluster_name || !cl.cluster_type || !cl.words || cl.words.length === 0) continue;

        // Insert new cluster record
        const { data: newCluster, error: clusterInsertErr } = await supabase
          .from('vocab_clusters')
          .insert({
            user_id,
            cycle_id: entry.cycle_id,
            cluster_name: cl.cluster_name.trim(),
            cluster_type: cl.cluster_type.trim(),
            word_count: cl.words.length,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (clusterInsertErr || !newCluster) {
          console.error(`[Vocab Worker] Failed to insert cluster "${cl.cluster_name}":`, clusterInsertErr?.message);
          continue;
        }

        console.log(`[Vocab Worker] Created cluster "${cl.cluster_name}" (ID: ${newCluster.id})`);

        // Link the words belonging to this cluster
        const cleanNormWords = cl.words.map((w: string) => w.trim().toLowerCase());
        const { error: linkWordsErr } = await supabase
          .from('vocab_words')
          .update({ cluster_id: newCluster.id })
          .eq('user_id', user_id)
          .eq('cycle_id', entry.cycle_id)
          .in('normalized_word', cleanNormWords);

        if (linkWordsErr) {
          console.error(`[Vocab Worker] Failed to link words to cluster "${cl.cluster_name}":`, linkWordsErr.message);
        } else {
          console.log(`[Vocab Worker] Linked ${cleanNormWords.length} words to cluster "${cl.cluster_name}"`);
        }
      }
    }

    console.log(`[Vocab Worker] Vocabulary processing completed successfully for entry ${entry_id}`);
  } catch (err: any) {
    console.error(`[Vocab Worker] Error during vocabulary processing:`, err);
    throw err;
  }
}
