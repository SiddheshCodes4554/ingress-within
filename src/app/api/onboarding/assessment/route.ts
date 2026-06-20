import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { getAIProvider } from '../../../../lib/ai/factory';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Check if this is a request to finalize onboarding (Summary review page 'Continue' click)
    if (body.finalize === true) {
      console.log(`[API Assessment] Finalizing onboarding for user ${user.userId}`);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true
        })
        .eq('id', user.userId);

      if (updateError) {
        console.error('Failed to finalize onboarding:', updateError);
        return NextResponse.json(
          { error: { code: 'DATABASE_ERROR', message: 'Failed to finalize onboarding.' } },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Onboarding finalized successfully.'
      });
    }

    // Otherwise, expect the 12 answers
    const { answers } = body;
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Answers object is required.' } },
        { status: 400 }
      );
    }

    // Validate that Q1 to Q12 exist and are valid numbers 1-5
    const qKeys = Array.from({ length: 12 }, (_, i) => `q${i + 1}`);
    const parsedAnswers: Record<string, number> = {};

    for (const key of qKeys) {
      const val = Number(answers[key]);
      if (isNaN(val) || val < 1 || val > 5) {
        return NextResponse.json(
          { error: { code: 'INVALID_RATING', message: `Rating for ${key} must be a number between 1 and 5.` } },
          { status: 400 }
        );
      }
      parsedAnswers[key] = val;
    }

    // 2. Calculate OCEAN averages
    const openness = (parsedAnswers.q1 + parsedAnswers.q2) / 2;
    const conscientiousness = (parsedAnswers.q3 + parsedAnswers.q4) / 2;
    const extraversion = (parsedAnswers.q5 + parsedAnswers.q6) / 2;
    const agreeableness = (parsedAnswers.q7 + parsedAnswers.q8 + parsedAnswers.q9) / 3;
    const neuroticism = (parsedAnswers.q10 + parsedAnswers.q11 + parsedAnswers.q12) / 3;

    console.log(`[API Assessment] Calculated OCEAN scores for user ${user.userId}:`, {
      openness,
      conscientiousness,
      extraversion,
      agreeableness,
      neuroticism
    });

    // 3. Call AI Provider synchronously
    const providerName = process.env.AI_PROVIDER || 'groq';
    const aiProvider = getAIProvider(providerName);
    
    let summaryText = '';
    try {
      summaryText = await aiProvider.generatePersonalitySummary({
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism
      });
    } catch (aiErr: any) {
      console.error('Failed to generate AI personality summary, using default:', aiErr);
      // Fallback description in case of API failure
      summaryText = `You show balanced qualities with a tendency to process experiences internally. You value self-reflection and structure in your daily routine. This space is designed for exactly that.`;
    }

    // 4. Update users table with scores, answers, and summary text
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        ocean_openness: openness,
        ocean_conscientiousness: conscientiousness,
        ocean_extraversion: extraversion,
        ocean_agreeableness: agreeableness,
        ocean_neuroticism: neuroticism,
        personality_profile_json: JSON.stringify(parsedAnswers),
        personality_summary_text: summaryText
      })
      .eq('id', user.userId);

    if (userUpdateError) {
      console.error('Failed to update users table with assessment data:', userUpdateError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to save personality scores.' } },
        { status: 500 }
      );
    }

    // 5. Update profiles table - assessment is completed, but onboarding_completed stays false until final click
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        assessment_completed: true
      })
      .eq('id', user.userId);

    if (profileUpdateError) {
      console.error('Failed to update profiles table assessment milestone:', profileUpdateError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to record assessment completion.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      personality_summary_text: summaryText
    });

  } catch (error) {
    console.error('Onboarding Assessment Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
