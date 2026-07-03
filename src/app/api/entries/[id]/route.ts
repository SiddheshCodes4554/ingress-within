import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { decrypt } from '../../../../lib/encryption';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const entryId = params.id;
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    if (!entryId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing entry ID.' } },
        { status: 400 }
      );
    }

    const { data: entry, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (error) {
      console.error(`[api/entries/[id]] Database error fetching entry ${entryId}:`, error);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve entry.' } },
        { status: 500 }
      );
    }

    if (!entry) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Entry not found.' } },
        { status: 404 }
      );
    }

    // Fetch associated reflection
    const { data: reflection, error: reflectionError } = await supabase
      .from('reflections')
      .select('*')
      .eq('entry_id', entryId)
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (reflectionError) {
      console.error(`[api/entries/[id]] Database error fetching reflection for entry ${entryId}:`, reflectionError);
    }

    // Fetch previous entry chronologically (created_at preceding current entry)
    const { data: previousEntry } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', authUser.userId)
      .lt('created_at', entry.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch previous reflection
    let previousReflection: any = null;
    if (previousEntry) {
      const { data: prevRef, error: prevRefError } = await supabase
        .from('reflections')
        .select('*')
        .eq('entry_id', previousEntry.id)
        .eq('user_id', authUser.userId)
        .maybeSingle();
      if (!prevRefError) {
        previousReflection = prevRef;
      }
    }

    // Fetch entry-specific vocabulary words from extractions
    let vocabWords: string[] = [];
    const { data: vocabRes, error: vocabErr } = await supabase
      .from('vocab_extractions')
      .select('word')
      .eq('user_id', authUser.userId)
      .eq('entry_id', entry.id);

    if (!vocabErr && vocabRes) {
      vocabWords = vocabRes.map((v: any) => v.word);
    } else {
      console.warn(`[api/entries/[id]] Failed to fetch vocab_extractions, falling back to vocab_words:`, vocabErr?.message);
      const { data: wordsRes } = await supabase
        .from('vocab_words')
        .select('word, entry_ids')
        .eq('user_id', authUser.userId);
      vocabWords = wordsRes 
        ? wordsRes.filter((v: any) => Array.isArray(v.entry_ids) && v.entry_ids.includes(entry.id)).map((v: any) => v.word)
        : [];
    }

    let prevVocabWords: string[] = [];
    if (previousEntry) {
      const { data: prevVocabRes, error: prevVocabErr } = await supabase
        .from('vocab_extractions')
        .select('word')
        .eq('user_id', authUser.userId)
        .eq('entry_id', previousEntry.id);

      if (!prevVocabErr && prevVocabRes) {
        prevVocabWords = prevVocabRes.map((v: any) => v.word);
      } else {
        console.warn(`[api/entries/[id]] Failed to fetch previous vocab_extractions, falling back to vocab_words:`, prevVocabErr?.message);
        const { data: wordsRes } = await supabase
          .from('vocab_words')
          .select('word, entry_ids')
          .eq('user_id', authUser.userId);
        prevVocabWords = wordsRes
          ? wordsRes.filter((v: any) => Array.isArray(v.entry_ids) && v.entry_ids.includes(previousEntry.id)).map((v: any) => v.word)
          : [];
      }
    }

    const reflectionState = reflection ? {
      ...reflection,
      vocabulary: vocabWords
    } : null;

    const previousReflectionState = previousReflection ? {
      ...previousReflection,
      vocabulary: prevVocabWords
    } : null;

    // Decrypt reflection response text (the answer to yesterday's question)
    const decryptedReflectionText = entry.reflection_text_encrypted 
      ? decrypt(entry.reflection_text_encrypted, entry.reflection_text_iv) 
      : null;

    const decryptedPrevReflectionText = previousEntry && previousEntry.reflection_text_encrypted
      ? decrypt(previousEntry.reflection_text_encrypted, previousEntry.reflection_text_iv)
      : null;

    return NextResponse.json({
      success: true,
      entry: {
        ...entry,
        decrypted_reflection_text: decryptedReflectionText
      },
      reflection: reflectionState,
      previousEntry: previousEntry ? {
        ...previousEntry,
        decrypted_reflection_text: decryptedPrevReflectionText
      } : null,
      previousReflection: previousReflectionState
    });

  } catch (error) {
    console.error('Entry GET Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
