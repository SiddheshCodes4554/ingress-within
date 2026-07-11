import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { supabase } from '../../../../lib/db';

/**
 * GET /api/knowledge/quiz: Fetches the authenticated user's quiz history.
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

    const { data: profile, error } = await supabase
      .from('knowledge_profile')
      .select('emotion_model')
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const quizHistory = profile?.emotion_model?.quiz_history || [];

    return NextResponse.json({
      success: true,
      history: quizHistory
    });
  } catch (error: any) {
    console.error('[API Knowledge Quiz GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge/quiz: Saves a completed quiz result.
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

    const body = await request.json();
    const { concept_name, score_correct, score_total } = body;

    if (!concept_name || typeof score_correct !== 'number' || typeof score_total !== 'number') {
      return NextResponse.json(
        { error: { code: 'INVALID_ARGUMENTS', message: 'concept_name, score_correct, and score_total are required.' } },
        { status: 400 }
      );
    }

    const { data: profile, error: fetchErr } = await supabase
      .from('knowledge_profile')
      .select('*')
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!profile) {
      return NextResponse.json(
        { error: { code: 'PROFILE_NOT_FOUND', message: 'User knowledge profile not found.' } },
        { status: 404 }
      );
    }

    const emotionModel = profile.emotion_model || {};
    const quizHistory = emotionModel.quiz_history || [];

    const newResult = {
      concept_name,
      score_correct,
      score_total,
      created_at: new Date().toISOString()
    };

    const updatedQuizHistory = [...quizHistory, newResult];

    // Keep only the last 100 quiz attempts to prevent size bloat
    if (updatedQuizHistory.length > 100) {
      updatedQuizHistory.shift();
    }

    const updatedEmotionModel = {
      ...emotionModel,
      quiz_history: updatedQuizHistory
    };

    const { error: updateErr } = await supabase
      .from('knowledge_profile')
      .update({ emotion_model: updatedEmotionModel })
      .eq('user_id', authUser.userId);

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      result: newResult
    });

  } catch (error: any) {
    console.error('[API Knowledge Quiz POST] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
