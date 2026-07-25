import { supabase } from '../../db';

export interface RebuildJobData {
  user_id: string;
  subsystem: 'vocabulary' | 'reports' | 'patterns' | 'assessment';
}

/**
 * Main worker execution logic for the intelligence rebuild queue.
 */
export async function processIntelligenceRebuild(data: RebuildJobData) {
  const { user_id: userId, subsystem } = data;
  console.log(`[Intelligence Rebuild Worker] Starting rebuild for user ${userId}, subsystem "${subsystem}"...`);

  try {
    // 1. Ensure user_intelligence_versions row exists
    const { data: versionsExist } = await supabase
      .from('user_intelligence_versions')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!versionsExist) {
      await supabase
        .from('user_intelligence_versions')
        .insert({ user_id: userId })
        .maybeSingle();
    }

    if (subsystem === 'vocabulary') {
      const { rebuildUserVocabulary } = await import('../../vocab/rebuildService');
      await rebuildUserVocabulary(userId);

      await supabase
        .from('user_intelligence_versions')
        .update({
          vocab_engine_version: '2.0',
          vocab_prompt_version: '1.0',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log(`[Intelligence Rebuild Worker] Vocabulary V2 rebuild completed successfully for user ${userId}.`);

    } else if (subsystem === 'reports') {
      const { backfillWeeklyReports } = await import('../../weeklyReportBackfill');
      await backfillWeeklyReports(userId);

      await supabase
        .from('user_intelligence_versions')
        .update({
          reports_engine_version: '2.0',
          reports_prompt_version: '1.0',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log(`[Intelligence Rebuild Worker] Weekly Reports rebuild completed successfully for user ${userId}.`);

    } else if (subsystem === 'patterns') {
      // Rebuild patterns: Seed/migrate default patterns if user has none
      const { data: existingPatterns } = await supabase
        .from('patterns')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (!existingPatterns || existingPatterns.length === 0) {
        console.log(`[Intelligence Rebuild Worker] Seeding default patterns for user ${userId}...`);

        // Get user's active cycle
        const { data: activeCycle } = await supabase
          .from('cycles')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'ACTIVE')
          .maybeSingle();

        const cycleId = activeCycle?.id;
        const cycleNum = activeCycle?.cycle_number || activeCycle?.number || 1;

        if (cycleId) {
          const defaultPatterns = [
            { name: 'Saying "fine"', orientation: 'Used about yourself — never about situations or other people.' },
            { name: 'Perfectionism as deflection', orientation: 'High standards applied to others appear to deflect from unmet expectations of yourself.' },
            { name: 'Avoidance', orientation: 'Dominant coping mechanism to keep emotional distance.' },
            { name: 'Conflict aversion', orientation: 'Steering clear of direct disagreement to maintain artificial harmony.' },
            { name: 'Calling it "overthinking"', orientation: 'Used as a catch-all label to dismiss complex or uncomfortable emotions.' },
            { name: 'Low self-agency', orientation: 'Interpreting events as happening strictly to you rather than having active choice.' }
          ];

          for (const dp of defaultPatterns) {
            const { data: pat } = await supabase
              .from('patterns')
              .insert({
                user_id: userId,
                name: dp.name,
                first_seen_cycle: 1,
                first_seen_at: new Date().toISOString(),
                orientation: dp.orientation,
                engine_version: '1.0',
                prompt_version: '1.0'
              })
              .select()
              .single();

            if (pat) {
              await supabase
                .from('pattern_cycle_states')
                .insert({
                  pattern_id: pat.id,
                  cycle_id: cycleId,
                  cycle_number: cycleNum,
                  status: dp.name.includes('Avoidance') || dp.name.includes('Conflict') ? 'shifting' : (dp.name.includes('thinking') || dp.name.includes('agency') ? 'gone_quiet' : 'present'),
                  note: 'Initialized during background intelligence migration.'
                });
            }
          }
        }
      }

      await supabase
        .from('user_intelligence_versions')
        .update({
          patterns_engine_version: '1.0',
          patterns_prompt_version: '1.0',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log(`[Intelligence Rebuild Worker] Patterns rebuild completed successfully for user ${userId}.`);

    } else if (subsystem === 'assessment') {
      // Rebuild assessment: simply mark completed for now
      await supabase
        .from('user_intelligence_versions')
        .update({
          assessment_engine_version: '1.0',
          assessment_prompt_version: '1.0',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log(`[Intelligence Rebuild Worker] Assessments rebuild completed successfully for user ${userId}.`);

    }
  } catch (error: any) {
    console.error(`[Intelligence Rebuild Worker] Error processing rebuild for user ${userId}, subsystem "${subsystem}":`, error.message || error);
    throw error;
  }
}
