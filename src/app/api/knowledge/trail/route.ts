import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { supabase } from '../../../../lib/db';

/**
 * Helper to ensure the knowledge_profile record exists for the user.
 */
async function ensureProfileExists(userId: string) {
  const { data: profile, error } = await supabase
    .from('knowledge_profile')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Profile check failed: ${error.message}`);
  }

  if (!profile) {
    const defaultProfile = {
      user_id: userId,
      identity_model: {},
      emotion_model: { visited_emotions: [] },
      vocabulary_model: {},
      pattern_model: {},
      agency_model: {},
      relationship_model: {},
      decision_model: {},
      growth_model: {},
      communication_model: {},
      stress_model: {},
      values_model: {},
      knowledge_version: '2.0'
    };
    const { data: newProfile, error: insertError } = await supabase
      .from('knowledge_profile')
      .insert(defaultProfile)
      .select('*')
      .single();

    if (insertError) {
      throw new Error(`Failed to create blank profile: ${insertError.message}`);
    }
    return newProfile;
  }

  return profile;
}

/**
 * GET /api/knowledge/trail: Returns the authenticated user's visited emotions list.
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

    const profile = await ensureProfileExists(authUser.userId);
    const visited = profile.emotion_model?.visited_emotions || [];

    return NextResponse.json({
      success: true,
      visited
    });
  } catch (error: any) {
    console.error('[API Knowledge Trail GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge/trail: Adds an emotion name to the user's visited trail list.
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

    const { concept_name } = await request.json();
    if (!concept_name || typeof concept_name !== 'string') {
      return NextResponse.json(
        { error: { code: 'INVALID_ARGUMENTS', message: 'concept_name is required and must be a string.' } },
        { status: 400 }
      );
    }

    const profile = await ensureProfileExists(authUser.userId);
    const emotionModel = profile.emotion_model || {};
    const visited: string[] = emotionModel.visited_emotions || [];

    // Filter duplicates and append at the end
    const updatedVisited = visited.filter(name => name !== concept_name);
    updatedVisited.push(concept_name);

    // Maintain a maximum of 50 visited emotions in trail
    if (updatedVisited.length > 50) {
      updatedVisited.shift();
    }

    const updatedEmotionModel = {
      ...emotionModel,
      visited_emotions: updatedVisited
    };

    const { error: updateError } = await supabase
      .from('knowledge_profile')
      .update({ emotion_model: updatedEmotionModel })
      .eq('user_id', authUser.userId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      visited: updatedVisited
    });
  } catch (error: any) {
    console.error('[API Knowledge Trail POST] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
