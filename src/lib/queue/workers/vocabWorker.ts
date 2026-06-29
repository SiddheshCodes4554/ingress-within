import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';
import { extractVocabularyDeterministic } from '../../vocabEngine';

export async function processVocabularyExtraction(jobData: {
  entry_id: string;
  user_id: string;
}) {
  const { entry_id, user_id } = jobData;

  console.log(`[Vocab Worker] Starting vocabulary processing for entry ${entry_id} (user ${user_id})`);

  // 1. Fetch the entry
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entry_id)
    .single();

  if (entryError || !entry) {
    throw new Error(`Failed to fetch entry ${entry_id}: ${entryError?.message || 'Not found'}`);
  }

  // Prevent duplicate processing
  if (entry.vocab_processed) {
    console.log(`[Vocab Worker] Entry ${entry_id} has already been processed for vocabulary. Skipping.`);
    return;
  }

  // 2. Decrypt entry text
  const entryText = decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv) || entry.content;
  if (!entryText || entryText.trim() === '') {
    console.log(`[Vocab Worker] Entry ${entry_id} has empty text. Marking as processed and skipping.`);
    await supabase.from('entries').update({ vocab_processed: true }).eq('id', entry_id);
    return;
  }

  // 3. Fetch latest unprocessed thread response for user in active cycle
  let threadText = '';
  let threadResp: any = null;
  try {
    const { data: resp, error: respErr } = await supabase
      .from('thread_responses')
      .select('*')
      .eq('user_id', user_id)
      .eq('vocab_processed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!respErr && resp) {
      threadResp = resp;
      threadText = resp.response_text || '';
      console.log(`[Vocab Worker] Found unprocessed thread response to include: "${threadText.substring(0, 40)}..."`);
    }
  } catch (err) {
    console.warn(`[Vocab Worker] Failed to query thread responses:`, err);
  }

  const fullText = entryText + (threadText ? '\n\n' + threadText : '');

  try {
    // 4. Deterministic Vocabulary Word Extraction
    console.log(`[Vocab Worker] Extracting literal vocabulary words deterministically...`);
    const { extracted } = extractVocabularyDeterministic(fullText);

    console.log(`[Vocab Worker] Extracted ${extracted.length} literal words.`);

    // 5. Update vocab_words table (deterministic frequency accumulation)
    for (const w of extracted) {
      const cleanWord = w.word.trim();
      const cleanNormWord = w.normalized_word.trim().toLowerCase();

      // Determine source: entry, thread or combined
      const inEntry = entryText.toLowerCase().includes(cleanNormWord);
      const inThread = threadText ? threadText.toLowerCase().includes(cleanNormWord) : false;
      let source = 'entry';
      if (inThread && !inEntry) {
        source = 'thread_response';
      } else if (inEntry && inThread) {
        source = 'combined';
      }

      // Check if word already exists in this cycle
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
            last_seen: new Date().toISOString(),
            source
          })
          .eq('id', existingWord.id);

        if (updateErr) {
          console.error(`[Vocab Worker] Failed to update word "${cleanNormWord}":`, updateErr.message);
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
            last_seen: new Date().toISOString(),
            source
          });

        if (insertErr) {
          console.error(`[Vocab Worker] Failed to insert word "${cleanNormWord}":`, insertErr.message);
        }
      }
    }

    // 6. Emotional Concept Extraction (using AI)
    console.log(`[Vocab Worker] Extracting emotional concepts using AI...`);
    const conceptResult = await aiProvider.extractConcepts(fullText);

    if (conceptResult.concepts && Array.isArray(conceptResult.concepts)) {
      console.log(`[Vocab Worker] Extracted ${conceptResult.concepts.length} emotional concepts.`);
      for (const c of conceptResult.concepts) {
        if (!c.concept) continue;
        const cleanConcept = c.concept.trim();

        // Check if concept already exists in this cycle
        const { data: existingConcept, error: conceptQueryErr } = await supabase
          .from('vocab_concepts')
          .select('id, frequency')
          .eq('user_id', user_id)
          .eq('cycle_id', entry.cycle_id)
          .eq('concept', cleanConcept)
          .maybeSingle();

        if (conceptQueryErr) {
          console.error(`[Vocab Worker] Error querying concept:`, conceptQueryErr.message);
          continue;
        }

        if (existingConcept) {
          // Increment frequency and update confidence
          await supabase
            .from('vocab_concepts')
            .update({
              frequency: existingConcept.frequency + 1,
              confidence: c.confidence || 1.0
            })
            .eq('id', existingConcept.id);
        } else {
          // Insert new concept record
          await supabase
            .from('vocab_concepts')
            .insert({
              user_id,
              cycle_id: entry.cycle_id,
              concept: cleanConcept,
              frequency: 1,
              confidence: c.confidence || 1.0
            });
        }
      }
    }

    // 7. Update vocab_clusters table (AI grouping, deterministic stats)
    console.log(`[Vocab Worker] Fetching all active cycle vocabulary words...`);
    const { data: allCycleWords, error: fetchWordsErr } = await supabase
      .from('vocab_words')
      .select('word, normalized_word, frequency')
      .eq('user_id', user_id)
      .eq('cycle_id', entry.cycle_id);

    if (fetchWordsErr) {
      throw new Error(`Failed to fetch cycle words for clustering: ${fetchWordsErr.message}`);
    }

    if (allCycleWords && allCycleWords.length > 0) {
      console.log(`[Vocab Worker] Clustering ${allCycleWords.length} active words...`);
      const clusterResult = await aiProvider.groupClusters(allCycleWords);

      if (clusterResult.clusters && Array.isArray(clusterResult.clusters)) {
        console.log(`[Vocab Worker] Received ${clusterResult.clusters.length} clusters from AI.`);

        // Delete existing clusters for this cycle
        await supabase
          .from('vocab_clusters')
          .delete()
          .eq('user_id', user_id)
          .eq('cycle_id', entry.cycle_id);

        // Re-create clusters and update vocab_words links
        for (const cl of clusterResult.clusters) {
          if (!cl.cluster_name || !cl.words || cl.words.length === 0) continue;

          const clusterWords = cl.words.map((w: string) => w.trim().toLowerCase());

          // Calculate cluster frequency deterministically from database words
          const matchingWordsObj = allCycleWords.filter(w => clusterWords.includes(w.normalized_word));
          const totalClusterFreq = matchingWordsObj.reduce((sum, w) => sum + w.frequency, 0);

          // Insert cluster record (words and frequency columns match required database schema)
          const { data: newCluster, error: clusterInsertErr } = await supabase
            .from('vocab_clusters')
            .insert({
              user_id,
              cycle_id: entry.cycle_id,
              cluster_name: cl.cluster_name.trim(),
              cluster_type: cl.cluster_type || 'emotional',
              words: clusterWords,
              frequency: totalClusterFreq
            })
            .select()
            .single();

          if (clusterInsertErr || !newCluster) {
            console.error(`[Vocab Worker] Failed to insert cluster "${cl.cluster_name}":`, clusterInsertErr?.message);
            continue;
          }

          // Link words to cluster
          const { error: linkWordsErr } = await supabase
            .from('vocab_words')
            .update({ cluster_id: newCluster.id })
            .eq('user_id', user_id)
            .eq('cycle_id', entry.cycle_id)
            .in('normalized_word', clusterWords);

          if (linkWordsErr) {
            console.error(`[Vocab Worker] Failed to link words to cluster "${cl.cluster_name}":`, linkWordsErr.message);
          }
        }
      }
    }

    // 8. Mark entry and thread response as processed
    await supabase
      .from('entries')
      .update({ vocab_processed: true })
      .eq('id', entry_id);

    if (threadResp) {
      await supabase
        .from('thread_responses')
        .update({ vocab_processed: true })
        .eq('id', threadResp.id);
    }

    console.log(`[Vocab Worker] Vocabulary processing completed successfully for entry ${entry_id}`);
  } catch (err: any) {
    console.error(`[Vocab Worker] Error during vocabulary processing:`, err);
    throw err;
  }
}
