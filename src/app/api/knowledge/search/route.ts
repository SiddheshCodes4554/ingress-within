import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { supabase } from '../../../../lib/db';

/**
 * GET /api/knowledge/search: Runs database queries for search keywords.
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
        results: { cards: [], relationships: [], entries: [], threads: [] }
      });
    }

    // Parallel searches in database
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
        }))
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
