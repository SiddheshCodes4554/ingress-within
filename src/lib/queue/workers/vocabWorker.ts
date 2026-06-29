import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';
import { extractVocabularyDeterministic, DETERMINISTIC_EMOTIONAL_WORDS, DETERMINISTIC_THEME_WORDS } from '../../vocabEngine';

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
  try {
    const fullText = entryText + (threadText ? '\n\n' + threadText : '');
    // Check if new columns exist (semantic_meaning, context, confidence, entry_ids)
    let hasNewColumns = false;
    try {
      const { data: testRow } = await supabase
        .from('vocab_words')
        .select('*')
        .limit(1);
      if (testRow && testRow.length > 0 && 'semantic_meaning' in testRow[0]) {
        hasNewColumns = true;
      } else {
        const { error: testErr } = await supabase
          .from('vocab_words')
          .select('semantic_meaning')
          .limit(1);
        if (!testErr) {
          hasNewColumns = true;
        }
      }
    } catch (_) {}

    // Check if category column exists (from v5 migration)
    let hasCategoryColumn = false;
    try {
      const { error: categoryErr } = await supabase
        .from('vocab_words')
        .select('category')
        .limit(1);
      if (!categoryErr) {
        hasCategoryColumn = true;
      }
    } catch (_) {}
    
    console.log(`[Vocab Worker] Database schema has personalized columns: ${hasNewColumns}, category column: ${hasCategoryColumn}`);

    // Extract vocabulary expressions using AI
    console.log(`[Vocab Worker] Extracting personalized emotional vocabulary using AI...`);
    const aiResult = await aiProvider.extractVocabulary(fullText);
    const expressions = aiResult?.expressions || [];

    console.log(`[Vocab Worker] AI extracted ${expressions.length} personalized expressions.`);

    for (const exp of expressions) {
      const cleanWord = exp.word.trim();
      const cleanNormWord = exp.normalized.trim().toLowerCase();
      
      // If normalized word is empty or too short, skip
      if (cleanNormWord.length < 3) continue;

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
        .select('*')
        .eq('user_id', user_id)
        .eq('cycle_id', entry.cycle_id)
        .eq('normalized_word', cleanNormWord)
        .maybeSingle();

      if (queryErr) {
        console.error(`[Vocab Worker] Error querying existing word:`, queryErr.message);
        continue;
      }

      // Merge raw tokens
      const incomingRawTokens = [cleanWord];
      const uniqueRawTokens = Array.from(new Set([
        ...(existingWord?.raw_tokens || []),
        ...incomingRawTokens
      ]));

      // Merge entry IDs
      const currentEntryIds = existingWord?.entry_ids || [];
      const uniqueEntryIds = Array.from(new Set([
        ...currentEntryIds,
        entry_id
      ]));

      // Build database payload
      const wordPayload: any = {
        frequency: existingWord ? existingWord.frequency + 1 : 1,
        last_seen: new Date().toISOString(),
        source,
        is_emotional: true, // For backwards compatibility
        emotional_score: exp.confidence || 1.0, // For backwards compatibility
        raw_tokens: uniqueRawTokens
      };

      if (hasCategoryColumn) {
        wordPayload.category = 'emotional'; // For backwards compatibility with by-cycle and legacy routes
      }

      if (hasNewColumns) {
        wordPayload.semantic_meaning = exp.semantic_meaning || '';
        wordPayload.context = exp.context || '';
        wordPayload.confidence = exp.confidence || 1.0;
        wordPayload.entry_ids = uniqueEntryIds;
      }

      if (existingWord) {
        // Update existing word record
        const { error: updateErr } = await supabase
          .from('vocab_words')
          .update(wordPayload)
          .eq('id', existingWord.id);

        if (updateErr) {
          console.error(`[Vocab Worker] Failed to update word "${cleanNormWord}":`, updateErr.message);
        }
      } else {
        // Insert new word record
        wordPayload.user_id = user_id;
        wordPayload.cycle_id = entry.cycle_id;
        wordPayload.word = cleanWord;
        wordPayload.normalized_word = cleanNormWord;
        wordPayload.first_seen = new Date().toISOString();

        const { error: insertErr } = await supabase
          .from('vocab_words')
          .insert(wordPayload);

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
          await supabase
            .from('vocab_concepts')
            .update({
              frequency: existingConcept.frequency + 1,
              confidence: c.confidence || 1.0
            })
            .eq('id', existingConcept.id);
        } else {
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

    // 7. Update vocab_clusters table (AI grouping, deterministic stats) using ONLY emotional words
    await generateAndSaveClusters(user_id, entry.cycle_id);

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

export async function generateAndSaveClusters(user_id: string, cycle_id: string): Promise<any[]> {
  console.log(`[Vocab Worker] Fetching all active cycle vocabulary words for user ${user_id}...`);
  
  // Check if custom schema columns exist in vocab_words
  let hasNewWordsColumns = false;
  try {
    const { error } = await supabase
      .from('vocab_words')
      .select('semantic_meaning')
      .limit(1);
    if (!error) hasNewWordsColumns = true;
  } catch (_) {}

  // Check if custom schema columns exist in vocab_clusters
  let hasNewClustersColumns = false;
  try {
    const { error } = await supabase
      .from('vocab_clusters')
      .select('description')
      .limit(1);
    if (!error) hasNewClustersColumns = true;
  } catch (_) {}

  const selectFields = hasNewWordsColumns 
    ? 'word, normalized_word, frequency, semantic_meaning' 
    : 'word, normalized_word, frequency';

  const { data: allCycleWords, error: fetchWordsErr } = await supabase
    .from('vocab_words')
    .select(selectFields)
    .eq('user_id', user_id)
    .eq('cycle_id', cycle_id)
    .eq('is_emotional', true);

  if (fetchWordsErr) {
    throw new Error(`Failed to fetch cycle words for clustering: ${fetchWordsErr.message}`);
  }

  const mappedClusters: any[] = [];

  if (allCycleWords && allCycleWords.length > 0) {
    console.log(`[Vocab Worker] Grouping ${allCycleWords.length} active words into personalized clusters...`);
    const clusterResult = await aiProvider.groupClusters(allCycleWords as any[]);

    if (clusterResult.clusters && Array.isArray(clusterResult.clusters)) {
      // 1. Filter out isolated clusters: supported by at least 2 distinct words, OR a single word with frequency >= 2
      const validClusters = clusterResult.clusters.filter(cl => {
        if (!cl.words || cl.words.length === 0) return false;
        if (cl.words.length > 1) return true; // Multiple distinct words
        
        // Check frequency of single word
        const singleNormWord = cl.words[0].trim().toLowerCase();
        const foundWord = allCycleWords.find(w => w.normalized_word === singleNormWord);
        return (foundWord?.frequency || 0) > 1; // Supported by multiple entries/evidence
      });

      console.log(`[Vocab Worker] Received ${clusterResult.clusters.length} raw clusters. Valid clusters after isolation check: ${validClusters.length}`);

      // Delete existing clusters for this cycle
      await supabase
        .from('vocab_clusters')
        .delete()
        .eq('user_id', user_id)
        .eq('cycle_id', cycle_id);

      // Re-create clusters and update vocab_words links
      for (const cl of validClusters) {
        if (!cl.cluster_name || !cl.words || cl.words.length === 0) continue;

        const clusterWords = cl.words.map((w: string) => w.trim().toLowerCase());

        const matchingWordsObj = allCycleWords.filter(w => clusterWords.includes(w.normalized_word));
        const totalClusterFreq = matchingWordsObj.reduce((sum, w) => sum + w.frequency, 0);

        const clusterPayload: any = {
          user_id,
          cycle_id,
          cluster_name: cl.cluster_name.trim(),
          cluster_type: 'emotional', // for backwards compatibility
          words: clusterWords,
          frequency: totalClusterFreq
        };

        if (hasNewClustersColumns) {
          clusterPayload.confidence = cl.confidence || 1.0;
          clusterPayload.description = cl.description || '';
        }

        const { data: newCluster, error: clusterInsertErr } = await supabase
          .from('vocab_clusters')
          .insert(clusterPayload)
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
          .eq('cycle_id', cycle_id)
          .in('normalized_word', clusterWords);

        if (linkWordsErr) {
          console.error(`[Vocab Worker] Failed to link words to cluster "${cl.cluster_name}":`, linkWordsErr.message);
        }

        mappedClusters.push(newCluster);
      }
    }
  }

  return mappedClusters;
}
