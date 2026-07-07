import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';
import { VocabularyIntelligenceService } from '../../vocab/vocabIntelligenceService';
import { triggerPatternProcessing } from '../triggers';

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
  bypass_ai?: boolean;
}) {
  const { entry_id, thread_response_id, user_id, bypass_ai } = jobData;

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
    let expressions: any[] = [];
    if (bypass_ai) {
      console.log(`[Vocab Worker] Bypassing AI extraction. Using local deterministic NLP engine.`);
      try {
        const { extractVocabularyDeterministic } = await import('../../vocabEngine');
        const detResult = extractVocabularyDeterministic(fullText);
        expressions = (detResult.extracted || []).map(item => ({
          word: item.word,
          normalized: item.normalized_word,
          semantic_meaning: 'Extracted deterministically via local NLP engine.',
          context: getVerbatimSentence(item.word, item.normalized_word, fullText) || '',
          confidence: 0.7
        }));
        console.log(`[Vocab Worker] Deterministic local NLP engine extracted ${expressions.length} expressions.`);
      } catch (detErr: any) {
        console.error(`[Vocab Worker] Deterministic local NLP extraction failed:`, detErr.message || detErr);
        throw detErr;
      }
    } else {
      try {
        // 2. Extract Vocabulary using AI
        console.log(`[Vocab Worker] Extracting expressions using AI...`);
        const aiResult = await aiProvider.extractVocabulary(fullText);
        expressions = aiResult?.expressions || [];
        console.log(`[Vocab Worker] AI extracted ${expressions.length} expressions.`);
      } catch (aiErr: any) {
        console.warn(`[Vocab Worker] AI vocabulary extraction failed: ${aiErr.message}. Falling back to deterministic NLP extraction.`);
        try {
          const { extractVocabularyDeterministic } = await import('../../vocabEngine');
          const detResult = extractVocabularyDeterministic(fullText);
          expressions = (detResult.extracted || []).map(item => ({
            word: item.word,
            normalized: item.normalized_word,
            semantic_meaning: 'Extracted deterministically via local NLP engine.',
            context: getVerbatimSentence(item.word, item.normalized_word, fullText) || '',
            confidence: 0.7
          }));
          console.log(`[Vocab Worker] Deterministic local NLP engine extracted ${expressions.length} expressions.`);
        } catch (detErr: any) {
          console.error(`[Vocab Worker] Deterministic local NLP fallback failed:`, detErr.message || detErr);
          throw aiErr; // rethrow original AI error if fallback fails too
        }
      }
    }

    let sourceCreatedAt = new Date().toISOString();
    if (entry_id && entry) {
      sourceCreatedAt = entry.created_at || sourceCreatedAt;
    } else if (thread_response_id && resp) {
      sourceCreatedAt = resp.created_at || sourceCreatedAt;
    }

    // 3. Clear existing extractions for this specific entry/thread response (idempotency)
    if (entry_id) {
      await supabase.from('vocab_extractions').delete().eq('entry_id', entry_id);
    } else if (thread_response_id) {
      await supabase.from('vocab_extractions').delete().eq('thread_response_id', thread_response_id);
    }

    // Verbatim Validation & Self-Healing
    const extractionsToInsert: any[] = [];
    for (const exp of expressions) {
      if (!exp.word || !exp.normalized || exp.normalized.trim().length < 2) continue;

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
        thread_id: thread_response_id || null,
        source_type: entry_id ? 'journal' : 'thread',
        word: matchedWord,
        original_word: matchedWord,
        normalized_word: exp.normalized.trim().toLowerCase(),
        sentence: verbatimSentence,
        sentence_context: verbatimSentence,
        confidence: exp.confidence || 1.0,
        sentence_reasoning: exp.semantic_meaning || '',
        extractor_version: '2.0',
        prompt_version: '2.0',
        provider: process.env.AI_PROVIDER || 'groq',
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        generated_at: sourceCreatedAt,
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

      // 4. Incrementally update vocab_words aggregates
      for (const ext of extractionsToInsert) {
        const normWord = ext.normalized_word;
        const matchedWord = ext.word;
        const docId = entry_id || thread_response_id;

        // Check if vocab_word row already exists
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

        // Determine source
        let wordSource = entry_id ? 'entry' : 'thread_response';
        if (existingWord) {
          if (existingWord.source !== wordSource) {
            wordSource = 'combined';
          }
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
          await supabase
            .from('vocab_words')
            .update(wordPayload)
            .eq('id', existingWord.id);
        } else {
          wordPayload.user_id = user_id;
          wordPayload.cycle_id = cycle_id;
          wordPayload.first_seen = sourceCreatedAt;
          await supabase
            .from('vocab_words')
            .insert(wordPayload);
        }
      }
    }

    // 5. Concepts Extraction (incremental concept accumulation)
    if (!bypass_ai) {
      console.log(`[Vocab Worker] Extracting emotional concepts using AI...`);
      try {
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
      } catch (conceptErr: any) {
        console.error(`[Vocab Worker] Concept extraction failed:`, conceptErr.message);
      }

      // 6. Trigger Word Clusters & Shift Signals updates in background
      try {
        await VocabularyIntelligenceService.getVocabularyOverview(user_id);
      } catch (clusterErr: any) {
        console.error(`[Vocab Worker] Failed to update intelligence layer:`, clusterErr.message);
      }
    }

    // 7. Mark document as processed
    if (entry_id) {
      await supabase.from('entries').update({ vocab_processed: true }).eq('id', entry_id);
      
      if (entry && (entry.cycle_day === 7 || entry.cycle_day === 14 || entry.cycle_day === 21)) {
        const weekNum = entry.cycle_day / 7;
        try {
          // Sync cycle current_day and updated_at
          const { data: cycle } = await supabase
            .from('cycles')
            .select('*')
            .eq('id', entry.cycle_id)
            .single();
          if (cycle) {
            const targetDay = Math.min(cycle.total_days, Math.max(cycle.current_day || 1, entry.cycle_day || 1));
            await supabase
              .from('cycles')
              .update({
                current_day: targetDay,
                updated_at: new Date().toISOString()
              })
              .eq('id', entry.cycle_id);
          }

          // Emit VOCABULARY_COMPLETED and CYCLE_METADATA_UPDATED events
          const { weeklyReportOrchestrator } = await import('../../weeklyReportOrchestrator');
          await weeklyReportOrchestrator.emitEvent({
            user_id,
            entry_id,
            cycle_id: entry.cycle_id,
            week_number: weekNum,
            job_name: 'VOCABULARY_COMPLETED',
            completed_at: new Date().toISOString(),
            status: 'success'
          });

          await weeklyReportOrchestrator.emitEvent({
            user_id,
            entry_id,
            cycle_id: entry.cycle_id,
            week_number: weekNum,
            job_name: 'CYCLE_METADATA_UPDATED',
            completed_at: new Date().toISOString(),
            status: 'success'
          });
        } catch (eventErr: any) {
          console.error(`[Vocab Worker] Error during cycle metadata sync or event emission:`, eventErr.message);
        }
      }
    } else if (thread_response_id) {
      await supabase.from('thread_responses').update({ vocab_processed: true }).eq('id', thread_response_id);
    }

    if (cycle_id) {
      try {
        const sourceType = entry_id ? 'journal' : 'thread';
        await triggerPatternProcessing(entry_id || thread_response_id || null, user_id, cycle_id, sourceType);
      } catch (triggerErr: any) {
        console.error(`[Vocab Worker] Failed to trigger pattern processing:`, triggerErr.message);
      }
    }

    console.log(`[Vocab Worker] Vocabulary processing completed successfully.`);
  } catch (err: any) {
    console.error(`[Vocab Worker] Error during vocabulary processing:`, err);
    throw err;
  }
}
