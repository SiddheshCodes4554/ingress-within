import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { PatternIntelligenceService } from '../../../../lib/patterns/patternIntelligenceService';

/**
 * POST /api/patterns/snapshot: Trigger snapshot generation or sealing.
 * Primarily called by background workers and cycle completion hooks.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const userId = authUser.userId;
    const body = await request.json();
    const { action, cycleId } = body;

    if (!cycleId) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'cycleId is required.' } },
        { status: 400 }
      );
    }

    if (action === 'seal') {
      await PatternIntelligenceService.sealCycleSnapshot(userId, cycleId);
      return NextResponse.json({
        success: true,
        message: `Sealed snapshot for cycle ${cycleId}.`
      });
    } else if (action === 'generate' || action === 'update') {
      await PatternIntelligenceService.generatePatternSnapshot(userId, cycleId);
      return NextResponse.json({
        success: true,
        message: `Generated snapshot for cycle ${cycleId}.`
      });
    } else {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Valid action is required ("generate", "update", "seal").' } },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('[API Pattern Snapshot POST] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
