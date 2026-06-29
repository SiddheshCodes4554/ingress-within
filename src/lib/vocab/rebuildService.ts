import { supabase } from '../db';
import { processVocabularyExtraction } from '../queue/workers/vocabWorker';

export async function rebuildUserVocabulary(user_id: string): Promise<{
  success: boolean;
  entriesProcessed: number;
  threadResponsesProcessed: number;
  wordsGenerated: number;
  clustersGenerated: number;
}> {
  console.log(`[Vocab Rebuild] Starting complete vocabulary rebuild for user ${user_id}...`);

  // 1. Set rebuild in progress flag
  await supabase
    .from('profiles')
    .update({ vocab_rebuild_in_progress: true })
    .eq('id', user_id);

  try {
    // 2. Clear all existing vocabulary tables for this user
    console.log(`[Vocab Rebuild] Cleaning up existing vocabulary records...`);
    await supabase.from('vocab_extractions').delete().eq('user_id', user_id);
    await supabase.from('vocab_words').delete().eq('user_id', user_id);
    await supabase.from('vocab_clusters').delete().eq('user_id', user_id);
    await supabase.from('vocab_concepts').delete().eq('user_id', user_id);

    // 3. Reset processed flags
    console.log(`[Vocab Rebuild] Resetting processed flags...`);
    await supabase.from('entries').update({ vocab_processed: false }).eq('user_id', user_id);
    await supabase.from('thread_responses').update({ vocab_processed: false }).eq('user_id', user_id);

    // 4. Fetch all entries chronologically
    const { data: entries, error: entriesErr } = await supabase
      .from('entries')
      .select('id')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true });

    if (entriesErr) {
      throw new Error(`Failed to fetch historical entries: ${entriesErr.message}`);
    }

    // 5. Fetch all thread responses chronologically
    const { data: responses, error: responsesErr } = await supabase
      .from('thread_responses')
      .select('id')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true });

    if (responsesErr) {
      throw new Error(`Failed to fetch historical thread responses: ${responsesErr.message}`);
    }

    const totalEntries = entries?.length || 0;
    const totalResponses = responses?.length || 0;
    console.log(`[Vocab Rebuild] Found ${totalEntries} entries and ${totalResponses} thread responses to process.`);

    // 6. Process entries sequentially
    for (let i = 0; i < totalEntries; i++) {
      const entryId = entries[i].id;
      console.log(`[Vocab Rebuild] Processing entry ${i + 1}/${totalEntries} (${entryId})`);
      await processVocabularyExtraction({ entry_id: entryId, user_id });
    }

    // 7. Process thread responses sequentially
    for (let j = 0; j < totalResponses; j++) {
      const respId = responses[j].id;
      console.log(`[Vocab Rebuild] Processing thread response ${j + 1}/${totalResponses} (${respId})`);
      await processVocabularyExtraction({ thread_response_id: respId, user_id });
    }

    // 8. Count results
    const { count: wordsCount } = await supabase
      .from('vocab_words')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id);

    const { count: clustersCount } = await supabase
      .from('vocab_clusters')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id);

    console.log(`[Vocab Rebuild] Finished! Generated ${wordsCount} words and ${clustersCount} clusters.`);

    return {
      success: true,
      entriesProcessed: totalEntries,
      threadResponsesProcessed: totalResponses,
      wordsGenerated: wordsCount || 0,
      clustersGenerated: clustersCount || 0
    };
  } catch (err: any) {
    console.error(`[Vocab Rebuild] Error during vocabulary rebuild:`, err);
    throw err;
  } finally {
    // 9. Reset rebuild flag
    await supabase
      .from('profiles')
      .update({ vocab_rebuild_in_progress: false })
      .eq('id', user_id);
  }
}
