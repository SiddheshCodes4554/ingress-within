import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';

interface OnboardingAnswers {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
  q10: number;
  q11: number;
  q12: number;
}

export async function processOceanSummary(jobData: {
  user_id: string;
  answers: OnboardingAnswers;
}) {
  const { user_id, answers } = jobData;

  console.log(`[OCEAN Summary Worker] Processing OCEAN assessment for user ${user_id}`);

  // Fallback to defaults (neutral 3.0) if answers are missing
  const q = answers || {
    q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3,
    q7: 3, q8: 3, q9: 3, q10: 3, q11: 3, q12: 3
  };

  // 1. Compute averages (1-5 scale)
  const openness = parseFloat(((q.q1 + q.q2) / 2).toFixed(2));
  const conscientiousness = parseFloat(((q.q3 + q.q4) / 2).toFixed(2));
  const extraversion = parseFloat(((q.q5 + q.q6) / 2).toFixed(2));
  const agreeableness = parseFloat(((q.q7 + q.q8 + q.q9) / 3).toFixed(2));
  const neuroticism = parseFloat(((q.q10 + q.q11 + q.q12) / 3).toFixed(2));

  try {
    // 2. Call AI Provider using a mock entry structure containing the scores
    const inputContent = `OCEAN Big Five personality scores (1-5 scale):
- Openness: ${openness}
- Conscientiousness: ${conscientiousness}
- Extraversion: ${extraversion}
- Agreeableness: ${agreeableness}
- Neuroticism: ${neuroticism}

Generate a concise 2-3 sentence plain language personality summary based on these Big Five traits.`;

    const result = await aiProvider.generateOceanSummary([
      { content: inputContent, created_at: new Date().toISOString() }
    ]);

    const personalitySummary = result.analysis;

    // 3. Update users table with scores, raw answers, and the generated summary text
    const { error: updateError } = await supabase
      .from('users')
      .update({
        ocean_openness: openness,
        ocean_conscientiousness: conscientiousness,
        ocean_extraversion: extraversion,
        ocean_agreeableness: agreeableness,
        ocean_neuroticism: neuroticism,
        personality_profile_json: q as any,
        personality_summary_text: personalitySummary,
        onboarding_done: false // Will be set to true on frontend redirect/continue
      })
      .eq('id', user_id);

    if (updateError) {
      throw new Error(`Failed to update user personality profile: ${updateError.message}`);
    }

    console.log(`[OCEAN Summary Worker] Successfully calculated OCEAN scores and generated summary text for user ${user_id}`);
  } catch (err: any) {
    console.error(`[OCEAN Summary Worker] Error generating OCEAN summary:`, err);
    throw err;
  }
}
