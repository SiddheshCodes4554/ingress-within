import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { VocabularyIntelligenceService } from '../../../../lib/vocab/vocabIntelligenceService';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const userId = authUser.userId;

    const { count: unprocessedEntries } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('vocab_processed', false);

    const { count: unprocessedResponses } = await supabase
      .from('thread_responses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('vocab_processed', false);

    // If there are unprocessed entries or thread responses, rebuild user vocabulary in background
    if ((unprocessedEntries || 0) > 0 || (unprocessedResponses || 0) > 0) {
      console.log(`[API Vocab Overview] Found unprocessed items (${unprocessedEntries} entries, ${unprocessedResponses} responses) for user ${userId}. Triggering vocabulary rebuild in background...`);
      const { rebuildUserVocabulary } = await import('../../../../lib/vocab/rebuildService');
      void rebuildUserVocabulary(userId, true).catch(err => {
        console.error('[API Vocab Overview] Background vocabulary rebuild failed:', err);
      });
    }

    // 2. Fetch stats via VocabularyIntelligenceService
    const auditParam = request.nextUrl.searchParams.get('vocabAudit') === 'true';
    const isDev = process.env.NODE_ENV === 'development';
    const forceAudit = auditParam || isDev;

    const data = await VocabularyIntelligenceService.getVocabularyOverview(userId, forceAudit);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('Vocab Overview GET Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
