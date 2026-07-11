import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { supabase } from '../../../../lib/db';
import { DICTIONARY_EMOTIONS, WORD_INDEX } from '../../../../lib/knowledge/dictionaryData';

/**
 * GET /api/knowledge/search: Runs database queries for search keywords.
 * Resolves synonyms/aliases from WORD_INDEX and returns matched emotions.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    if (!query) {
      return NextResponse.json({
        success: true,
        results: { cards: [], relationships: [], entries: [], threads: [], matchedEmotions: [] }
      });
    }

    const lowerQuery = query.toLowerCase();

    // 1. Resolve synonyms / aliases from WORD_INDEX
    const matchedEmotionNames = new Set<string>();
    
    // Direct matches in dictionary emotion keys
    Object.keys(DICTIONARY_EMOTIONS).forEach(name => {
      if (name.toLowerCase() === lowerQuery || name.toLowerCase().includes(lowerQuery) || lowerQuery.includes(name.toLowerCase())) {
        matchedEmotionNames.add(name);
      }
    });

    // Synonym/Alias mapping check
    Object.entries(WORD_INDEX).forEach(([word, info]: [string, any]) => {
      if (word === lowerQuery || word.includes(lowerQuery) || lowerQuery.includes(word)) {
        if (info.matches) {
          info.matches.forEach((m: string) => matchedEmotionNames.add(m));
        }
      }
    });

    const matchedEmotions = Array.from(matchedEmotionNames)
      .map(name => {
        const emo = DICTIONARY_EMOTIONS[name];
        if (!emo) return null;
        return { name, ...emo };
      })
      .filter(Boolean);

    // 2. Parallel searches in user's database records
    const [cardsRes, relsRes, entriesRes, threadsRes] = await Promise.all([
      supabase.from('knowledge_cards').select('*').eq('user_id', authUser.userId).ilike('title', `%${query}%`),
      supabase.from('knowledge_relationships').select('*').eq('user_id', authUser.userId).or(`source_node.ilike.%${query}%,target_node.ilike.%${query}%`),
      supabase.from('entries').select('id, content, created_at, cycle_day').eq('user_id', authUser.userId).ilike('content', `%${query}%`),
      supabase.from('thread_responses').select('id, response_text, created_at').eq('user_id', authUser.userId).ilike('response_text', `%${query}%`)
    ]);

    return NextResponse.json({
      success: true,
      results: {
        cards: cardsRes.data || [],
        relationships: relsRes.data || [],
        entries: (entriesRes.data || []).map(e => ({
          id: e.id,
          text: e.content,
          date: e.created_at,
          cycle_day: e.cycle_day
        })),
        threads: (threadsRes.data || []).map(t => ({
          id: t.id,
          text: t.response_text,
          date: t.created_at
        })),
        matchedEmotions
      }
    });
  } catch (error: any) {
    console.error('[API Knowledge Search GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
