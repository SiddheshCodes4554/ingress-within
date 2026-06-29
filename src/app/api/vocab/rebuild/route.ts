import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { rebuildUserVocabulary } from '../../../../lib/vocab/rebuildService';
import { supabase } from '../../../../lib/db';

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

    // Check if a rebuild is already in progress
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('vocab_rebuild_in_progress')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) {
      console.error('[Rebuild API] Error querying profile rebuild status:', profileErr);
    }

    if (profile?.vocab_rebuild_in_progress) {
      return NextResponse.json(
        { error: { code: 'REBUILD_IN_PROGRESS', message: 'A vocabulary rebuild is already running.' } },
        { status: 409 }
      );
    }

    // Trigger rebuild asynchronously in the background so the HTTP request returns immediately
    console.log(`[Rebuild API] Triggering background vocabulary rebuild for user ${userId}...`);
    rebuildUserVocabulary(userId)
      .then((res) => {
        console.log(`[Rebuild API] Background vocabulary rebuild completed successfully for user ${userId}.`, res);
      })
      .catch((err) => {
        console.error(`[Rebuild API] Background vocabulary rebuild failed for user ${userId}:`, err);
      });

    return NextResponse.json({
      success: true,
      message: 'Vocabulary rebuild triggered successfully in the background.'
    }, { status: 202 });

  } catch (error: any) {
    console.error('[Rebuild API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('vocab_rebuild_in_progress')
      .eq('id', authUser.userId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      inProgress: !!profile?.vocab_rebuild_in_progress
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
