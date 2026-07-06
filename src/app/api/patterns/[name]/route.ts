import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { PatternIntelligenceService } from '../../../../lib/patterns/patternIntelligenceService';

/**
 * GET /api/patterns/[name]: Fetches detailed timeline and evidence for a specific pattern.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const userId = authUser.userId;
    const patternName = params.name;

    if (!patternName) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Pattern name is required.' } },
        { status: 400 }
      );
    }

    const detail = await PatternIntelligenceService.getPatternDetail(userId, patternName);

    if (!detail) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Pattern not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pattern: detail
    });

  } catch (error: any) {
    console.error('[API Pattern Detail GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
