import { supabase } from '../../db';
import { aiProvider } from '../../ai/factory';
import { decrypt } from '../../encryption';

export async function processExerciseInsight(jobData: {
  exercise_id: string;
  user_id: string;
}) {
  const { exercise_id, user_id } = jobData;

  console.log(`[Exercise Insight Worker] Processing exercise ${exercise_id} (user ${user_id})`);

  // 1. Fetch exercise row
  const { data: exercise, error: fetchError } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exercise_id)
    .single();

  if (fetchError || !exercise) {
    throw new Error(`Failed to fetch exercise ${exercise_id}: ${fetchError?.message || 'Not found'}`);
  }

  // 2. Parse response data
  let responseObj: any = null;
  const rawResponse = decrypt(exercise.response_encrypted, null) || exercise.response_encrypted;

  if (!rawResponse) {
    throw new Error(`Exercise ${exercise_id} has empty response data.`);
  }

  try {
    responseObj = typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;
  } catch (err: any) {
    console.error(`[Exercise Insight Worker] JSON parsing failed:`, err);
    throw new Error(`Failed to parse exercise response data: ${err.message}`);
  }

  const { stressor_type, reactive_thought, reframed_thought } = responseObj;

  if (!stressor_type || !reactive_thought || !reframed_thought) {
    console.log(`[Exercise Insight Worker] Incomplete thoughts. Marking exercise as failed.`);
    await supabase
      .from('exercises')
      .update({ status: 'failed' })
      .eq('id', exercise_id);
    return;
  }

  try {
    // 3. Call AI Provider
    const result = await aiProvider.generateExerciseInsight(
      stressor_type,
      reactive_thought,
      reframed_thought
    );

    // 4. Format insight note
    let insight_note = result.insight;
    if (result.recommendations && result.recommendations.length > 0) {
      insight_note += '\n\nRecommendations:\n' + result.recommendations.map(r => `• ${r}`).join('\n');
    }

    // 5. Update exercises table
    const { error: updateError } = await supabase
      .from('exercises')
      .update({
        insight_note,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', exercise_id);

    if (updateError) {
      throw new Error(`Failed to update exercise insight: ${updateError.message}`);
    }

    console.log(`[Exercise Insight Worker] Successfully generated insight for exercise ${exercise_id}`);
  } catch (err: any) {
    console.error(`[Exercise Insight Worker] Error during AI generation:`, err);
    await supabase
      .from('exercises')
      .update({ status: 'failed' })
      .eq('id', exercise_id);
    throw err;
  }
}
