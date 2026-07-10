import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';
import { VocabularyIntelligenceService, VocabularySnapshotData } from '../../vocab/vocabIntelligenceService';
import { triggerPatternProcessing } from '../triggers';

export function getVerbatimSentence(word: string, normalized: string, fullText: string): string | null {
  const cleanWord = word.toLowerCase().trim();
  const cleanNorm = normalized.toLowerCase().trim();
  
  // Split on sentence boundaries
  const sentences = fullText.split(/(?<=[.!?])\s+/);
  
  for (const s of sentences) {
    const cleanS = s.toLowerCase();
    
    if (cleanS.includes(cleanWord)) {
      return s.trim();
    }
    
    if (cleanNorm && cleanS.includes(cleanNorm)) {
      return s.trim();
    }
    
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

/**
 * Validates the generated snapshot data before publishing.
 */
async function validateVocabularySnapshot(
  userId: string, 
  cycleId: string, 
  snapshotPayload: any
): Promise<boolean> {
  try {
    const words = snapshotPayload.words || [];
    for (const w of words) {
      if (!w.normalized_word || w.frequency <= 0) return false;
      
      // Verify every cited entry/thread response belongs to the correct user
      if (w.entry_ids?.length > 0) {
        const { data: entriesCheck } = await supabase
          .from('entries')
          .select('id, user_id')
          .in('id', w.entry_ids);
        
        if (entriesCheck && entriesCheck.some(e => e.user_id !== userId)) {
          console.error(`[Vocab Validation] Cited entry belongs to another user!`);
          return false;
        }
      }
    }
    return true;
  } catch (err) {
    console.error('[Vocab Validation] Error during snapshot validation:', err);
    return false;
  }
}

/**
 * Computes, validates, and updates a cycle snapshot.
 */
export async function compileAndCacheCycleSnapshot(userId: string, cycleId: string) {
  console.log(`[Vocab Worker] Compiling and caching snapshot for cycle ${cycleId}...`);
  try {
    const { data: cycle } = await supabase
      .from('cycles')
      .select('*')
      .eq('id', cycleId)
      .single();

    if (!cycle) return;

    // Fetch all extractions for this cycle
    const { data: extractions } = await supabase
      .from('vocab_extractions')
      .select('*')
      .eq('cycle_id', cycleId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    const extractionsCount = extractions?.length || 0;

    // Aggregate vocab words in memory
    const wordGroups = new Map<string, any>();
    extractions?.forEach((ext: any) => {
      const norm = ext.normalized_word.toLowerCase().trim();
      const verbatimWord = ext.original_word || ext.word;
      if (!wordGroups.has(norm)) {
        wordGroups.set(norm, {
          word: verbatimWord,
          normalized_word: norm,
          frequency: 0,
          first_seen: ext.created_at,
          last_seen: ext.created_at,
          semantic_meaning: ext.sentence_reasoning || '',
          context: ext.sentence_context || ext.sentence || '',
          confidence: ext.confidence || 1.0,
          entry_ids: []
        });
      }
      const group = wordGroups.get(norm);
      group.frequency += 1;
      const docId = ext.entry_id || ext.thread_response_id;
      if (docId && !group.entry_ids.includes(docId)) {
        group.entry_ids.push(docId);
      }
      
      const extTime = new Date(ext.created_at).getTime();
      if (extTime >= new Date(group.last_seen).getTime()) {
        group.last_seen = ext.created_at;
        group.word = verbatimWord;
        group.context = ext.sentence_context || ext.sentence || '';
        group.semantic_meaning = ext.sentence_reasoning || group.semantic_meaning;
      }
    });

    const sortedCyWords = Array.from(wordGroups.values()).sort((a, b) => b.frequency - a.frequency);
    const mostUsed = sortedCyWords.slice(0, 3).map(w => ({ word: w.word, normalized_word: w.normalized_word, frequency: w.frequency }));

    // Fetch existing clusters or generate if needed
    const { data: cachedClusters } = await supabase
      .from('vocab_clusters')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId);

    const currentTop3Words = sortedCyWords.slice(0, 3).map(w => w.normalized_word);
    let activeClusters = cachedClusters || [];

    let needsRegen = false;
    if (!cachedClusters || cachedClusters.length === 0) {
      needsRegen = true;
    } else {
      const cachedNames = cachedClusters.map(cl => cl.cluster_name.toLowerCase().trim());
      const top3Match = currentTop3Words.every(w => cachedNames.includes(w));
      if (!top3Match) {
        needsRegen = true;
      } else {
        const totalClusterFreq = cachedClusters.reduce((sum, c) => sum + (c.frequency || 0), 0);
        if (extractionsCount - totalClusterFreq >= 5) {
          needsRegen = true;
        }
      }
    }

    if (needsRegen && currentTop3Words.length > 0) {
      activeClusters = await VocabularyIntelligenceService.backgroundGenerateClusters(userId, cycleId, sortedCyWords);
    }

    // Determine new and dropped words
    const { data: priorSnaps } = await supabase
      .from('vocab_snapshots')
      .select('cycle_id, snapshot_data, generated_at')
      .eq('user_id', userId);

    const allSeenWords = new Set<string>();
    let prevWords = new Set<string>();

    const sortedSnaps = (priorSnaps || [])
      .filter(s => s.cycle_id !== cycleId)
      .sort((a, b) => new Date(a.generated_at).getTime() - new Date(b.generated_at).getTime());

    sortedSnaps.forEach(snap => {
      const data = snap.snapshot_data as VocabularySnapshotData;
      if (data && data.words) {
        data.words.forEach(w => allSeenWords.add(w.normalized_word.toLowerCase().trim()));
      }
    });

    if (sortedSnaps.length > 0) {
      const lastSnap = sortedSnaps[sortedSnaps.length - 1];
      const lastData = lastSnap.snapshot_data as VocabularySnapshotData;
      if (lastData && lastData.words) {
        lastData.words.forEach(w => prevWords.add(w.normalized_word.toLowerCase().trim()));
      }
    }

    const newWords: string[] = [];
    sortedCyWords.forEach(w => {
      if (!allSeenWords.has(w.normalized_word)) {
        newWords.push(w.normalized_word);
      }
    });

    const droppedWords = Array.from(prevWords).filter(w => !wordGroups.has(w));

    const { count: entryCount } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('cycle_id', cycleId)
      .eq('user_id', userId);

    const snapshotPayload = {
      entry_count: entryCount || 0,
      words: sortedCyWords,
      most_used: mostUsed,
      new_words: newWords,
      dropped_words: droppedWords,
      clusters: activeClusters.map(cl => ({
        cluster_name: cl.cluster_name,
        description: cl.description,
        confidence: cl.confidence,
        words: cl.words
      }))
    };

    // Validation Quality Gate check
    const isValid = await validateVocabularySnapshot(userId, cycleId, snapshotPayload);
    if (!isValid) {
      console.warn(`[Vocab Worker] Snapshot validation FAILED. Skipping publish.`);
      return;
    }

    await supabase
      .from('vocab_snapshots')
      .upsert({
        user_id: userId,
        cycle_id: cycleId,
        snapshot_data: snapshotPayload,
        generated_at: new Date().toISOString()
      }, { onConflict: 'user_id,cycle_id' });

    console.log(`[Vocab Worker] Successfully compiled and cached snapshot for cycle ${cycleId}.`);
  } catch (err: any) {
    console.error(`[Vocab Worker] Failed to compile snapshot:`, err.message || err);
  }
}

/**
 * Triggers chronological backfill for users with historical entries.
 */
async function ensureChronologicalBackfill(userId: string) {
  // Check if backfill indicator snapshot exists
  const { data: backfillSnap } = await supabase
    .from('vocab_snapshots')
    .select('*')
    .eq('user_id', userId)
    .eq('cycle_id', '11111111-1111-1111-1111-111111111111')
    .maybeSingle();

  if (backfillSnap) return;

  console.log(`[Vocab Worker] User ${userId} has no completed backfill indicator. Starting chronological backfill...`);

  // Fetch all unprocessed journal entries chronologically
  const { data: entries } = await supabase
    .from('entries')
    .select('id')
    .eq('user_id', userId)
    .eq('vocab_processed', false)
    .order('created_at', { ascending: true });

  if (entries && entries.length > 0) {
    for (const e of entries) {
      await processSingleVocabularyExtraction({ entry_id: e.id, user_id: userId });
    }
  }

  // Fetch all unprocessed thread responses chronologically
  const { data: threads } = await supabase
    .from('thread_responses')
    .select('id')
    .eq('user_id', userId)
    .eq('vocab_processed', false)
    .order('created_at', { ascending: true });

  if (threads && threads.length > 0) {
    for (const t of threads) {
      await processSingleVocabularyExtraction({ thread_response_id: t.id, user_id: userId });
    }
  }

  // Set backfill indicator snapshot
  const { data: dummyCycle } = await supabase
    .from('cycles')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (dummyCycle) {
    await supabase
      .from('vocab_snapshots')
      .upsert({
        user_id: userId,
        cycle_id: '11111111-1111-1111-1111-111111111111', // Dummy completed indicator
        snapshot_data: { vocab_backfill_completed: true, completed_at: new Date().toISOString() },
        generated_at: new Date().toISOString()
      }, { onConflict: 'user_id,cycle_id' });
  }

  console.log(`[Vocab Worker] Chronological backfill completed for user ${userId}.`);
}

/**
 * Worker entrypoint.
 */
export async function processVocabularyExtraction(jobData: {
  entry_id?: string;
  thread_response_id?: string;
  user_id: string;
  bypass_ai?: boolean;
}) {
  const { user_id } = jobData;
  
  // Ensure chronological historical backfill runs first (idempotent, once per user)
  await ensureChronologicalBackfill(user_id);

  // Process the specific active job
  await processSingleVocabularyExtraction(jobData);
}

/**
 * Extracts and stores vocabulary for a single document.
 */
async function processSingleVocabularyExtraction(jobData: {
  entry_id?: string;
  thread_response_id?: string;
  user_id: string;
  bypass_ai?: boolean;
}) {
  const { entry_id, thread_response_id, user_id, bypass_ai } = jobData;

  let cycle_id = '';
  let fullText = '';
  let source = '';
  let entry: any = null;
  let resp: any = null;

  if (entry_id) {
    const { data: dbEntry } = await supabase.from('entries').select('*').eq('id', entry_id).single();
    if (!dbEntry) return;
    entry = dbEntry;
    if (entry.vocab_processed) return; // Processed exactly once

    cycle_id = entry.cycle_id;
    fullText = decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv) || entry.content || '';
    source = 'entry';
  } else if (thread_response_id) {
    const { data: dbResp } = await supabase.from('thread_responses').select('*, threads(cycle_id)').eq('id', thread_response_id).single() as any;
    if (!dbResp) return;
    resp = dbResp;
    if (resp.vocab_processed) return; // Processed exactly once

    cycle_id = resp.threads?.cycle_id;
    fullText = resp.response_text || '';
    source = 'thread_response';
  }

  if (!cycle_id || !fullText.trim()) {
    if (entry_id) await supabase.from('entries').update({ vocab_processed: true }).eq('id', entry_id);
    else if (thread_response_id) await supabase.from('thread_responses').update({ vocab_processed: true }).eq('id', thread_response_id);
    return;
  }

  try {
    let expressions: any[] = [];
    if (bypass_ai) {
      const { extractVocabularyDeterministic } = await import('../../vocabEngine');
      const detResult = extractVocabularyDeterministic(fullText);
      expressions = (detResult.extracted || []).map(item => ({
        word: item.word,
        normalized: item.normalized_word,
        semantic_meaning: 'Extracted deterministically via local NLP engine.',
        context: getVerbatimSentence(item.word, item.normalized_word, fullText) || '',
        confidence: 0.7
      }));
    } else {
      try {
        const aiResult = await aiProvider.extractVocabulary(fullText);
        expressions = aiResult?.expressions || [];
      } catch (aiErr) {
        console.warn(`[Vocab Worker] AI vocabulary extraction failed. Falling back to NLP:`, aiErr);
        const { extractVocabularyDeterministic } = await import('../../vocabEngine');
        const detResult = extractVocabularyDeterministic(fullText);
        expressions = (detResult.extracted || []).map(item => ({
          word: item.word,
          normalized: item.normalized_word,
          semantic_meaning: 'Extracted deterministically via local NLP engine.',
          context: getVerbatimSentence(item.word, item.normalized_word, fullText) || '',
          confidence: 0.7
        }));
      }
    }

    let sourceCreatedAt = new Date().toISOString();
    if (entry_id && entry) {
      sourceCreatedAt = entry.created_at || sourceCreatedAt;
    } else if (thread_response_id && resp) {
      sourceCreatedAt = resp.created_at || sourceCreatedAt;
    }

    // Clean old extractions (idempotency)
    if (entry_id) {
      await supabase.from('vocab_extractions').delete().eq('entry_id', entry_id);
    } else if (thread_response_id) {
      await supabase.from('vocab_extractions').delete().eq('thread_response_id', thread_response_id);
    }

    const extractionsToInsert: any[] = [];
    for (const exp of expressions) {
      if (!exp.word || !exp.normalized || exp.normalized.trim().length < 2) continue;

      const verbatimSentence = getVerbatimSentence(exp.word, exp.normalized, fullText);
      if (!verbatimSentence) continue;

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
        thread_id: thread_response_id || null,
        source_type: entry_id ? 'journal' : 'thread',
        word: matchedWord,
        original_word: matchedWord,
        normalized_word: exp.normalized.trim().toLowerCase(),
        sentence: verbatimSentence,
        sentence_context: verbatimSentence,
        confidence: exp.confidence || 1.0,
        sentence_reasoning: exp.semantic_meaning || '',
        extractor_version: '3.0',
        prompt_version: '3.0',
        provider: process.env.AI_PROVIDER || 'gemini',
        model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        generated_at: sourceCreatedAt,
        created_at: sourceCreatedAt
      });
    }

    if (extractionsToInsert.length > 0) {
      await supabase.from('vocab_extractions').insert(extractionsToInsert);

      // Incrementally update vocab_words aggregates
      for (const ext of extractionsToInsert) {
        const normWord = ext.normalized_word;
        const matchedWord = ext.word;
        const docId = entry_id || thread_response_id;

        const { data: existingWord } = await supabase
          .from('vocab_words')
          .select('*')
          .eq('user_id', user_id)
          .eq('cycle_id', cycle_id)
          .eq('normalized_word', normWord)
          .maybeSingle();

        const uniqueEntryIds = Array.from(new Set([
          ...(existingWord?.entry_ids || []),
          docId
        ].filter(Boolean)));

        let wordSource = entry_id ? 'entry' : 'thread_response';
        if (existingWord && existingWord.source !== wordSource) {
          wordSource = 'combined';
        }

        const wordPayload: any = {
          frequency: existingWord ? existingWord.frequency + 1 : 1,
          last_seen: sourceCreatedAt,
          source: wordSource,
          is_emotional: true,
          confidence: ext.confidence,
          word: matchedWord,
          normalized_word: normWord,
          semantic_meaning: ext.sentence_reasoning || '',
          context: ext.sentence_context || '',
          entry_ids: uniqueEntryIds,
          raw_tokens: Array.from(new Set([...(existingWord?.raw_tokens || []), matchedWord]))
        };

        if (existingWord) {
          await supabase.from('vocab_words').update(wordPayload).eq('id', existingWord.id);
        } else {
          wordPayload.user_id = user_id;
          wordPayload.cycle_id = cycle_id;
          wordPayload.first_seen = sourceCreatedAt;
          await supabase.from('vocab_words').insert(wordPayload);
        }
      }
    }

    // Set processed flag
    if (entry_id) {
      await supabase.from('entries').update({ vocab_processed: true }).eq('id', entry_id);
    } else if (thread_response_id) {
      await supabase.from('thread_responses').update({ vocab_processed: true }).eq('id', thread_response_id);
    }

    // Compile, validate and cache snapshot for current active cycle
    await compileAndCacheCycleSnapshot(user_id, cycle_id);

    // Emit event notifications
    try {
      const { KnowledgeService } = await import('../../knowledge/knowledgeService');
      await KnowledgeService.emitKnowledgeEvent(
        user_id,
        cycle_id || null,
        entry_id || null,
        'VocabularyUpdated',
        'vocabulary_engine',
        {
          entry_id: entry_id || null,
          thread_response_id: thread_response_id || null
        }
      );
    } catch (e) {
      console.error(`[Vocab Worker] Failed to emit Knowledge event:`, e);
    }

    // Trigger Pattern processing
    if (cycle_id) {
      const sourceType = entry_id ? 'journal' : 'thread';
      await triggerPatternProcessing(entry_id || thread_response_id || null, user_id, cycle_id, sourceType);
    }

  } catch (err) {
    console.error(`[Vocab Worker] Error processing single vocabulary extraction:`, err);
    throw err;
  }
}
