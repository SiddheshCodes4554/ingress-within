import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { supabase } from '../../../../lib/db';

/**
 * GET /api/knowledge/resonance: Fetches all resonance ratings/notes for cards and patterns.
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

    // 1. Fetch card resonance from knowledge_cards
    const { data: dbCards, error: cardError } = await supabase
      .from('knowledge_cards')
      .select('id, card_type, title, json_data')
      .eq('user_id', authUser.userId);

    if (cardError) {
      throw cardError;
    }

    const cardResonanceList = (dbCards || [])
      .filter(c => c.json_data && (c.json_data as any).resonance)
      .map(c => ({
        concept_id: c.id,
        concept_name: c.title,
        concept_type: 'card',
        score: (c.json_data as any).resonance.score,
        notes: (c.json_data as any).resonance.notes,
        updated_at: (c.json_data as any).resonance.updated_at
      }));

    // 2. Fetch pattern resonance from knowledge_profile
    const { data: profile, error: profileError } = await supabase
      .from('knowledge_profile')
      .select('pattern_model')
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const patternResonanceMap = profile?.pattern_model?.resonance || {};
    const patternResonanceList = Object.entries(patternResonanceMap).map(([name, data]: [string, any]) => ({
      concept_name: name,
      concept_type: 'pattern',
      score: data.score,
      notes: data.notes,
      updated_at: data.updated_at
    }));

    return NextResponse.json({
      success: true,
      cards: cardResonanceList,
      patterns: patternResonanceList
    });
  } catch (error: any) {
    console.error('[API Knowledge Resonance GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge/resonance: Stores a resonance slider value and notes for a card or pattern.
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
    const { concept_id, concept_name, concept_type, score, notes } = body;

    if (!concept_name || !concept_type || typeof score !== 'number') {
      return NextResponse.json(
        { error: { code: 'INVALID_ARGUMENTS', message: 'concept_name, concept_type, and score are required.' } },
        { status: 400 }
      );
    }

    const cleanScore = Math.max(1, Math.min(5, Math.floor(score)));
    const timestamp = new Date().toISOString();

    if (concept_type === 'card') {
      // Find card by ID or title
      let query = supabase.from('knowledge_cards').select('*').eq('user_id', authUser.userId);
      if (concept_id) {
        query = query.eq('id', concept_id);
      } else {
        query = query.eq('title', concept_name);
      }

      const { data: cards, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      if (!cards || cards.length === 0) {
        return NextResponse.json(
          { error: { code: 'CARD_NOT_FOUND', message: 'Matching knowledge card not found.' } },
          { status: 404 }
        );
      }

      const card = cards[0];
      const updatedJsonData = {
        ...(card.json_data || {}),
        resonance: {
          score: cleanScore,
          notes: (notes || '').trim(),
          updated_at: timestamp
        }
      };

      const { error: updateErr } = await supabase
        .from('knowledge_cards')
        .update({ json_data: updatedJsonData })
        .eq('id', card.id);

      if (updateErr) throw updateErr;

    } else if (concept_type === 'pattern') {
      // Find profile
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

      const patternModel = profile.pattern_model || {};
      const currentResonance = patternModel.resonance || {};

      const updatedResonance = {
        ...currentResonance,
        [concept_name]: {
          score: cleanScore,
          notes: (notes || '').trim(),
          updated_at: timestamp
        }
      };

      const updatedPatternModel = {
        ...patternModel,
        resonance: updatedResonance
      };

      const { error: updateErr } = await supabase
        .from('knowledge_profile')
        .update({ pattern_model: updatedPatternModel })
        .eq('user_id', authUser.userId);

      if (updateErr) throw updateErr;

    } else {
      return NextResponse.json(
        { error: { code: 'INVALID_TYPE', message: 'concept_type must be either card or pattern.' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      resonance: {
        concept_name,
        concept_type,
        score: cleanScore,
        notes: (notes || '').trim(),
        updated_at: timestamp
      }
    });

  } catch (error: any) {
    console.error('[API Knowledge Resonance POST] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
