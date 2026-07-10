import { NextRequest, NextResponse } from 'next/server';
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
