import { supabase } from '../../../../lib/db';

export interface Exercise3SnapshotContext {
  ex0Result?: any;
  ex1Result?: any;
  ex2Result?: any;
  vocabSnapshots: any[];
  patternSnapshots: any[];
  knowledgeSnapshots: any[];
  weeklyReports: any[];
  monthlyReports: any[];
  journalEntries: any[];
  reflectionScores: any[];
}

export class Exercise3SnapshotLoader {
  /**
   * Loads ONLY immutable stored snapshots for Exercise 3 analysis.
   * NEVER reads live dashboard data, NEVER regenerates reports, NEVER mutates snapshots.
   */
  public static async loadSnapshots(userId: string, cycleNumber: number = 1): Promise<Exercise3SnapshotContext> {
    console.log(`[Exercise3SnapshotLoader] Loading read-only snapshots for user: ${userId}, cycle: ${cycleNumber}`);

    // 1. Fetch Exercise 0 Result
    const ex0Result = await this.fetchExerciseResult(userId, 'exercise_0');

    // 2. Fetch Exercise 1 Result
    const ex1Result = await this.fetchExerciseResult(userId, 'exercise_1');

    // 3. Fetch Exercise 2 Result
    const ex2Result = await this.fetchExerciseResult(userId, 'exercise_2');

    // 4. Fetch Vocabulary Snapshots
    const { data: vocabSnapshots } = await supabase
      .from('vocab_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 5. Fetch Pattern Snapshots
    const { data: patternSnapshots } = await supabase
      .from('pattern_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 6. Fetch Knowledge Snapshots
    const { data: knowledgeSnapshots } = await supabase
      .from('knowledge_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 7. Fetch Weekly Reports
    const { data: weeklyReports } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 8. Fetch Monthly/Cycle Reports
    const { data: monthlyReports } = await supabase
      .from('cycle_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 9. Fetch Journal Entries (read-only logs for cycle)
    const { data: journalEntries } = await supabase
      .from('entries')
      .select('id, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(30);

    // 10. Fetch Reflection Scores
    const { data: reflectionScores } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return {
      ex0Result: ex0Result || null,
      ex1Result: ex1Result || null,
      ex2Result: ex2Result || null,
      vocabSnapshots: vocabSnapshots || [],
      patternSnapshots: patternSnapshots || [],
      knowledgeSnapshots: knowledgeSnapshots || [],
      weeklyReports: weeklyReports || [],
      monthlyReports: monthlyReports || [],
      journalEntries: journalEntries || [],
      reflectionScores: reflectionScores || []
    };
  }

  private static async fetchExerciseResult(userId: string, exerciseId: string): Promise<any | null> {
    const { data: instances } = await supabase
      .from('exercise_instances')
      .select('id')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1);

    if (!instances || instances.length === 0) return null;

    const { data: result } = await supabase
      .from('exercise_results')
      .select('*')
      .eq('instance_id', instances[0].id)
      .maybeSingle();

    return result || null;
  }
}
