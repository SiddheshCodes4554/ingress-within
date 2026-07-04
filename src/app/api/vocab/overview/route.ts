import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { VocabularyIntelligenceService } from '../../../../lib/vocab/vocabIntelligenceService';
import { rebuildUserVocabulary } from '../../../../lib/vocab/rebuildService';

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

    // 1. Fetch user's processed intelligence versions
    const { data: userVersions } = await supabase
      .from('user_intelligence_versions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const currentEngine = '2.0';
    const currentPrompt = '1.0';

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

    const versionMismatch = !userVersions || 
      userVersions.vocab_engine_version !== currentEngine || 
      userVersions.vocab_prompt_version !== currentPrompt;

    const needsRebuild = versionMismatch || (unprocessedEntries || 0) > 0 || (unprocessedResponses || 0) > 0;

    if (needsRebuild) {
      console.log(`[Vocab API] Rebuild needed (versionMismatch: ${versionMismatch}, unprocessed: ${(unprocessedEntries || 0) + (unprocessedResponses || 0)}). Scheduling async rebuild...`);
      const { queueRegistry } = await import('../../../../lib/queue/registry');
      await queueRegistry.addJob(
        'intelligence_rebuild',
        `rebuild_vocabulary_${userId}`,
        { user_id: userId, subsystem: 'vocabulary' },
        `rebuild_vocabulary_${userId}`
      );
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
