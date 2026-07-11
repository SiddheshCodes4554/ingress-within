import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { FAMILIES, DICTIONARY_EMOTIONS, WORD_INDEX, PATTERNS, SITUATIONS } from '../../../../lib/knowledge/dictionaryData';

/**
 * GET /api/knowledge/dictionary
 * Serving the standard emotion taxonomy, search indexes, patterns library, and situations.
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

    return NextResponse.json({
      success: true,
      families: FAMILIES,
      emotions: DICTIONARY_EMOTIONS,
      wordIndex: WORD_INDEX,
      patterns: PATTERNS,
      situations: SITUATIONS
    });
  } catch (error: any) {
    console.error('[API Knowledge Dictionary GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
