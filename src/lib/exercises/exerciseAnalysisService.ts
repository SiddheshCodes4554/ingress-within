import { supabase } from '../db';

export interface ExerciseContext {
  responses: string;
  entries?: string;
  vocabulary?: string;
  knowledge?: string;
  patterns?: string;
  weeklySummaries?: string;
}

export class ExerciseAnalysisService {
  /**
   * Safe Context Builder.
   * Loads only the database dependencies required for the specific exercise id.
   * Filters all queries strictly by user_id and cycle_id/instance_id for security.
   */
  public static async loadContext(
    userId: string,
    instanceId: string,
    exerciseId: string,
    cycleId: string | null
  ): Promise<ExerciseContext> {
    console.log(`[AnalysisService] Loading context for user: ${userId}, exercise: ${exerciseId}`);

    // 1. Fetch user responses for this instance (required by all exercises)
    const { data: responses, error: respErr } = await supabase
      .from('exercise_responses')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('user_id', userId);

    if (respErr) {
      throw new Error(`Failed to load response context: ${respErr.message}`);
    }

    const formattedResponses = (responses || [])
      .filter(r => r.question_id !== '__screen_state')
      .map(r => `Question: ${r.question_id} (Step: ${r.step_id})\nAnswer: ${JSON.stringify(r.response)}`)
      .join('\n\n');

    const context: ExerciseContext = {
      responses: formattedResponses || 'No responses recorded.'
    };

    // 2. Fetch conditional dependencies based on exercise type
    if (exerciseId === 'exercise_1') {
      // Load responses + first 9 entries + Vocabulary words
      const { data: entries } = await supabase
        .from('entries')
        .select('content, cycle_day, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(9);

      const formattedEntries = (entries || [])
        .map((e, idx) => `Entry ${idx + 1} (Day: ${e.cycle_day}): ${e.content}`)
        .join('\n\n');

      const { data: vocab } = await supabase
        .from('vocab_words')
        .select('word, occurrences')
        .eq('user_id', userId)
        .limit(30);

      const formattedVocab = (vocab || [])
        .map(v => `${v.word} (${v.occurrences || 1}x)`)
        .join(', ');

      context.entries = formattedEntries || 'No recent entries found.';
      context.vocabulary = formattedVocab || 'No vocabulary terms logged.';
    } 
    else if (exerciseId === 'exercise_3') {
      // Load responses + all entries for cycle + knowledge profiles + patterns + weekly summaries
      if (cycleId) {
        const { data: entries } = await supabase
          .from('entries')
          .select('content, cycle_day, created_at')
          .eq('user_id', userId)
          .eq('cycle_id', cycleId)
          .order('cycle_day', { ascending: true });

        const formattedEntries = (entries || [])
          .map(e => `Day ${e.cycle_day}: ${e.content}`)
          .join('\n\n');

        const { data: weeklySummaries } = await supabase
          .from('weekly_summaries')
          .select('week_number, title, body')
          .eq('user_id', userId)
          .eq('cycle_id', cycleId)
          .order('week_number', { ascending: true });

        const formattedSummaries = (weeklySummaries || [])
          .map(w => `Week ${w.week_number} Summary: ${w.title}\nInsight: ${w.body}`)
          .join('\n\n');

        context.entries = formattedEntries || 'No cycle entries found.';
        context.weeklySummaries = formattedSummaries || 'No weekly summaries found.';
      }

      // Latest knowledge snapshot
      const { data: knowledge } = await supabase
        .from('knowledge_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Latest pattern snapshot
      const { data: patterns } = await supabase
        .from('pattern_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      context.knowledge = knowledge ? JSON.stringify(knowledge.snapshot_data || {}) : 'No knowledge profile snapshot found.';
      context.patterns = patterns ? JSON.stringify(patterns.snapshot_data || {}) : 'No pattern snapshot found.';
    }

    return context;
  }
}
