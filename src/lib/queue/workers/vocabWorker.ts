import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';

export function getVerbatimSentence(word: string, normalized: string, fullText: string): string | null {
  const cleanWord = word.toLowerCase().trim();
  const cleanNorm = normalized.toLowerCase().trim();
  
  // Split on sentence boundaries (period, exclamation, question mark followed by space)
  const sentences = fullText.split(/(?<=[.!?])\s+/);
  
  for (const s of sentences) {
    const cleanS = s.toLowerCase();
    
    // Check verbatim match
    if (cleanS.includes(cleanWord)) {
      return s.trim();
    }
    
    if (cleanNorm && cleanS.includes(cleanNorm)) {
      return s.trim();
    }
    
    // Word boundary checks for single words
    if (!cleanWord.includes(' ')) {
      const rxWord = new RegExp(`\\b${cleanWord}\\b`, 'i');
      if (rxWord.test(s)) {
        return s.trim();
      }
      if (cleanNorm) {
        const rxNorm = new RegExp(`\\b${cleanNorm}\\b`, 'i');
        if (rxNorm.test(s)) {
          return s.trim();
        }
      }
    }
  }

  // Fallback substring check in full text
  const lowerText = fullText.toLowerCase();
  if (lowerText.includes(cleanWord) || (cleanNorm && lowerText.includes(cleanNorm))) {
    const targetWord = lowerText.includes(cleanWord) ? cleanWord : cleanNorm;
    const idx = lowerText.indexOf(targetWord);
    if (idx !== -1) {
      let startIdx = 0;
      for (let i = idx; i >= 0; i--) {
        if (['.', '!', '?', '\n'].includes(fullText[i])) {
          startIdx = i + 1;
          break;
        }
      }
      let endIdx = fullText.length;
      for (let i = idx; i < fullText.length; i++) {
        if (['.', '!', '?', '\n'].includes(fullText[i])) {
          endIdx = i + 1;
          break;
        }
      }
      return fullText.substring(startIdx, endIdx).trim();
    }
  }
  
  return null;
}

export async function processVocabularyExtraction(jobData: {
  entry_id?: string;
  thread_response_id?: string;
  user_id: string;
}) {
  const { entry_id, thread_response_id, user_id } = jobData;

  console.log(`[Vocab Worker] Starting vocabulary processing for job:`, JSON.stringify(jobData));

  let cycle_id = '';
  let fullText = '';
  let source = '';
  let entry: any = null;
  let resp: any = null;

  // 1. Resolve source document
  if (entry_id) {
    const { data: dbEntry, error: entryError } = await supabase
      .from('entries')
      .select('*')
      .eq('id', entry_id)
      .single();

    if (entryError || !dbEntry) {
      throw new Error(`Failed to fetch entry ${entry_id}: ${entryError?.message || 'Not found'}`);
    }
    entry = dbEntry;

    if (entry.vocab_processed) {
      console.log(`[Vocab Worker] Entry ${entry_id} has already been processed. Skipping.`);
      return;
    }

    cycle_id = entry.cycle_id;
    fullText = decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv) || entry.content || '';
    source = 'entry';
  } else if (thread_response_id) {
    const { data: dbResp, error: respError } = await supabase
      .from('thread_responses')
      .select('*, threads(cycle_id)')
      .eq('id', thread_response_id)
      .single() as any;

    if (respError || !dbResp) {
      throw new Error(`Failed to fetch thread response ${thread_response_id}: ${respError?.message || 'Not found'}`);
    }
    resp = dbResp;

    if (resp.vocab_processed) {
      console.log(`[Vocab Worker] Thread response ${thread_response_id} has already been processed. Skipping.`);
      return;
    }

    cycle_id = resp.threads?.cycle_id;
    fullText = resp.response_text || '';
    source = 'thread_response';
  }

  if (!cycle_id) {
    console.warn(`[Vocab Worker] Could not resolve cycle_id for job. Skipping.`);
    return;
  }

  if (!fullText.trim()) {
    console.log(`[Vocab Worker] Empty content. Marking as processed and skipping.`);
    if (entry_id) {
      await supabase.from('entries').update({ vocab_processed: true }).eq('id', entry_id);
    } else if (thread_response_id) {
      await supabase.from('thread_responses').update({ vocab_processed: true }).eq('id', thread_response_id);
    }
    return;
  }

  try {
    // Check if new columns exist (semantic_meaning, context, confidence, entry_ids)
    let hasNewColumns = false;
    try {
      const { error: testErr } = await supabase
        .from('vocab_words')
        .select('semantic_meaning')
        .limit(1);
      if (!testErr) hasNewColumns = true;
    } catch (_) {}

    // Check if category column exists (from v5 migration)
    let hasCategoryColumn = false;
    try {
      const { error: categoryErr } = await supabase
        .from('vocab_words')
        .select('category')
        .limit(1);
      if (!categoryErr) hasCategoryColumn = true;
    } catch (_) {}

    // Check if vocab_extractions table exists
    let hasExtractionsTable = false;
    try {
      const { error: extErr } = await supabase
        .from('vocab_extractions')
        .select('id')
        .limit(1);
      if (!extErr) hasExtractionsTable = true;
    } catch (_) {}

    console.log(`[Vocab Worker] Database schema: hasNewColumns=${hasNewColumns}, hasCategoryColumn=${hasCategoryColumn}, hasExtractionsTable=${hasExtractionsTable}`);

    // 2. Extract Vocabulary using AI
    console.log(`[Vocab Worker] Extracting expressions using AI...`);
    const aiResult = await aiProvider.extractVocabulary(fullText);
    const expressions = aiResult?.expressions || [];

    console.log(`[Vocab Worker] AI extracted ${expressions.length} expressions.`);

    // 3. Clear existing extractions for this specific entry/thread response (idempotency)
    if (hasExtractionsTable) {
      if (entry_id) {
        await supabase
          .from('vocab_extractions')
          .delete()
          .eq('entry_id', entry_id);
      } else if (thread_response_id) {
        await supabase
          .from('vocab_extractions')
          .delete()
          .eq('thread_response_id', thread_response_id);
      }

      let sourceCreatedAt = new Date().toISOString();
      if (entry_id && entry) {
        sourceCreatedAt = entry.created_at || sourceCreatedAt;
      } else if (thread_response_id && resp) {
        sourceCreatedAt = resp.created_at || sourceCreatedAt;
      }

      // Verbatim Validation & Self-Healing
      const extractionsToInsert: any[] = [];
      for (const exp of expressions) {
        if (!exp.word || !exp.normalized || exp.normalized.trim().length < 3) continue;

        const verbatimSentence = getVerbatimSentence(exp.word, exp.normalized, fullText);
        if (!verbatimSentence) {
          console.warn(`[Vocab Worker] Discarding expression "${exp.word}" (normalized: "${exp.normalized}"): verbatim check failed.`);
          continue;
        }

        // Adjust word to match exact casing inside the verbatim sentence
        let matchedWord = exp.word.trim();
        const sentenceLower = verbatimSentence.toLowerCase();
        const wordLower = exp.word.trim().toLowerCase();
        const idx = sentenceLower.indexOf(wordLower);
        if (idx !== -1) {
          matchedWord = verbatimSentence.substring(idx, idx + wordLower.length);
        }

        extractionsToInsert.push({
          user_id,
          cycle_id,
          entry_id: entry_id || null,
          thread_response_id: thread_response_id || null,
          word: matchedWord,
          normalized_word: exp.normalized.trim().toLowerCase(),
          sentence: verbatimSentence,
          confidence: exp.confidence || 1.0,
          sentence_reasoning: exp.semantic_meaning || '',
          created_at: sourceCreatedAt
        });
      }

      if (extractionsToInsert.length > 0) {
        const { error: extInsertErr } = await supabase
          .from('vocab_extractions')
          .insert(extractionsToInsert);
        if (extInsertErr) {
          console.error(`[Vocab Worker] Failed to insert audit extractions:`, extInsertErr.message);
        } else {
          console.log(`[Vocab Worker] Logged ${extractionsToInsert.length} verified audit extractions.`);
        }
      }
    }

    // 4. Update/Recalculate vocab_words for the cycle
    if (hasExtractionsTable) {
      // Fetch all extractions for this cycle
      const { data: cycleExtractions, error: extFetchErr } = await supabase
        .from('vocab_extractions')
        .select('*')
        .eq('user_id', user_id)
        .eq('cycle_id', cycle_id);

      if (extFetchErr) {
        console.error(`[Vocab Worker] Failed to fetch cycle extractions:`, extFetchErr.message);
      } else {
        const extractions = cycleExtractions || [];
        
        // Group by normalized_word
        const groups = new Map<string, typeof extractions>();
        extractions.forEach(ext => {
          const list = groups.get(ext.normalized_word) || [];
          list.push(ext);
          groups.set(ext.normalized_word, list);
        });

        const activeWords = Array.from(groups.keys());

        // Delete vocab_words for the cycle that are no longer in extractions
        if (activeWords.length > 0) {
          // Format activeWords for Postgres SQL IN array format
          const activeWordsList = activeWords.map(w => w.replace(/'/g, "''"));
          await supabase
            .from('vocab_words')
            .delete()
            .eq('user_id', user_id)
            .eq('cycle_id', cycle_id)
            .not('normalized_word', 'in', `(${activeWordsList.map(w => `'${w}'`).join(',')})`);
        } else {
          await supabase
            .from('vocab_words')
            .delete()
            .eq('user_id', user_id)
            .eq('cycle_id', cycle_id);
        }

        // Upsert aggregated vocab_words
        for (const [normWord, group] of groups.entries()) {
          // Sort by created_at desc to find the most recent
          const sorted = [...group].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const mostRecent = sorted[0];

          // Determine first_seen and last_seen
          const dates = group.map(g => new Date(g.created_at).getTime());
          const firstSeen = new Date(Math.min(...dates)).toISOString();
          const lastSeen = new Date(Math.max(...dates)).toISOString();

          // Get unique entry/thread IDs
          const entryIds = Array.from(new Set(group.map(g => g.entry_id).filter(Boolean)));
          
          // Determine source
          const hasEntry = group.some(g => g.entry_id);
          const hasThread = group.some(g => g.thread_response_id);
          const wordSource = (hasEntry && hasThread) ? 'combined' : (hasThread ? 'thread_response' : 'entry');

          // Collect unique raw tokens
          const rawTokens = Array.from(new Set(group.map(g => g.word)));

          const wordPayload: any = {
            frequency: group.length,
            first_seen: firstSeen,
            last_seen: lastSeen,
            source: wordSource,
            is_emotional: true,
            emotional_score: mostRecent.confidence,
            raw_tokens: rawTokens,
            word: mostRecent.word,
            normalized_word: normWord
          };

          if (hasCategoryColumn) {
            wordPayload.category = 'emotional';
          }

          if (hasNewColumns) {
            wordPayload.semantic_meaning = mostRecent.sentence_reasoning || '';
            wordPayload.context = mostRecent.sentence || '';
            wordPayload.confidence = mostRecent.confidence;
            wordPayload.entry_ids = entryIds;
          }

          // Check if it already exists
          const { data: existingWord } = await supabase
            .from('vocab_words')
            .select('id')
            .eq('user_id', user_id)
            .eq('cycle_id', cycle_id)
            .eq('normalized_word', normWord)
            .maybeSingle();

          if (existingWord) {
            await supabase
              .from('vocab_words')
              .update(wordPayload)
              .eq('id', existingWord.id);
          } else {
            wordPayload.user_id = user_id;
            wordPayload.cycle_id = cycle_id;
            await supabase
              .from('vocab_words')
              .insert(wordPayload);
          }
        }
      }
    } else {
      // Slower fallback if vocab_extractions migration is not run yet
      console.warn(`[Vocab Worker] vocab_extractions table not found. Using legacy incremental fallback.`);
      for (const exp of expressions) {
        const cleanWord = exp.word.trim();
        const cleanNormWord = exp.normalized.trim().toLowerCase();
        
        if (cleanNormWord.length < 3) continue;

        const verbatimSentence = getVerbatimSentence(cleanWord, cleanNormWord, fullText);
        if (!verbatimSentence) {
          console.warn(`[Vocab Worker] Discarding legacy expression "${cleanWord}": verbatim check failed.`);
          continue;
        }

        const { data: existingWord } = await supabase
          .from('vocab_words')
          .select('*')
          .eq('user_id', user_id)
          .eq('cycle_id', cycle_id)
          .eq('normalized_word', cleanNormWord)
          .maybeSingle();

        const uniqueEntryIds = Array.from(new Set([
          ...(existingWord?.entry_ids || []),
          entry_id || thread_response_id
        ].filter(Boolean)));

        const wordPayload: any = {
          frequency: existingWord ? existingWord.frequency + 1 : 1,
          last_seen: new Date().toISOString(),
          source: entry_id ? 'entry' : 'thread_response',
          is_emotional: true,
          emotional_score: exp.confidence || 1.0,
          raw_tokens: Array.from(new Set([...(existingWord?.raw_tokens || []), cleanWord]))
        };

        if (hasCategoryColumn) wordPayload.category = 'emotional';
        if (hasNewColumns) {
          wordPayload.semantic_meaning = exp.semantic_meaning || '';
          wordPayload.context = exp.context || '';
          wordPayload.confidence = exp.confidence || 1.0;
          wordPayload.entry_ids = uniqueEntryIds;
        }

        if (existingWord) {
          await supabase.from('vocab_words').update(wordPayload).eq('id', existingWord.id);
        } else {
          wordPayload.user_id = user_id;
          wordPayload.cycle_id = cycle_id;
          wordPayload.word = cleanWord;
          wordPayload.normalized_word = cleanNormWord;
          wordPayload.first_seen = new Date().toISOString();
          await supabase.from('vocab_words').insert(wordPayload);
        }
      }
    }

    // 5. Concepts Extraction
    console.log(`[Vocab Worker] Extracting emotional concepts using AI...`);
    const conceptResult = await aiProvider.extractConcepts(fullText);

    if (conceptResult.concepts && Array.isArray(conceptResult.concepts)) {
      for (const c of conceptResult.concepts) {
        if (!c.concept) continue;
        const cleanConcept = c.concept.trim();

        const { data: existingConcept } = await supabase
          .from('vocab_concepts')
          .select('id, frequency')
          .eq('user_id', user_id)
          .eq('cycle_id', cycle_id)
          .eq('concept', cleanConcept)
          .maybeSingle();

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
              cycle_id,
              concept: cleanConcept,
              frequency: 1,
              confidence: c.confidence || 1.0
            });
        }
      }
    }

    // 6. Update vocab_clusters
    await generateAndSaveClusters(user_id, cycle_id);

    // 7. Mark document as processed
    if (entry_id) {
      await supabase.from('entries').update({ vocab_processed: true }).eq('id', entry_id);
    } else if (thread_response_id) {
      await supabase.from('thread_responses').update({ vocab_processed: true }).eq('id', thread_response_id);
    }

    console.log(`[Vocab Worker] Vocabulary processing completed successfully.`);
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
    .eq('is_emotional', true) as any;

  if (fetchWordsErr) {
    throw new Error(`Failed to fetch cycle words for clustering: ${fetchWordsErr.message}`);
  }

  const mappedClusters: any[] = [];

  if (allCycleWords && allCycleWords.length > 0) {
    // Sort words by frequency desc, then take top 40 to avoid token limits (especially on organizations with 6000 TPM limit)
    const sortedWords = [...allCycleWords].sort((a: any, b: any) => (b.frequency || 0) - (a.frequency || 0));
    const wordsToGroup = sortedWords.slice(0, 40);

    console.log(`[Vocab Worker] Grouping top ${wordsToGroup.length} of ${allCycleWords.length} active words into personalized clusters...`);
    const clusterResult = await aiProvider.groupClusters(wordsToGroup as any[]);

    if (clusterResult.clusters && Array.isArray(clusterResult.clusters)) {
      // Filter out isolated clusters: supported by at least 2 distinct words, OR a single word with frequency >= 2
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
