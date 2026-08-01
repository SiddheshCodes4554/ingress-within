import { supabase } from '../../db';
import { InterventionRepository } from '../repositories/intervention.repository';
import { RecommendationResponse, RecommendationResult, RecommendationRule } from '../types';

export class RecommendationService {
  private static ENGINE_VERSION = 'v1.0-deterministic';
  private interventionRepo: InterventionRepository;

  constructor(interventionRepo?: InterventionRepository) {
    this.interventionRepo = interventionRepo || new InterventionRepository();
  }

  /**
   * Defined Rule Engine Matrix.
   * Pure deterministic rule mapping based on platform snapshots.
   * ZERO AI / ZERO LLM calls.
   */
  private rules: RecommendationRule[] = [
    {
      rule_id: 'RULE_RUMINATION_PATTERN',
      trigger_source: 'pattern',
      matched_key: 'rumination',
      recommended_intervention_ids: ['anx_004', 'anx_003', 'anx_002'],
      explanation: 'Recommended based on identified rumination or looping thought pattern in your journal history.',
      priority: 90,
    },
    {
      rule_id: 'RULE_OVERWHELM_VOCAB',
      trigger_source: 'vocab',
      matched_key: 'overwhelmed',
      recommended_intervention_ids: ['str_002', 'str_004', 'anx_005'],
      explanation: 'Recommended due to frequent vocabulary entries expressing overwhelm or high cognitive load.',
      priority: 85,
    },
    {
      rule_id: 'RULE_SLEEP_PRACTICE',
      trigger_source: 'sleep',
      matched_key: 'sleep_issues',
      recommended_intervention_ids: ['slp_001', 'slp_002', 'slp_003'],
      explanation: 'Recommended based on reported bedtime racing thoughts or sleep disruption patterns.',
      priority: 80,
    },
    {
      rule_id: 'RULE_LOW_MOOD',
      trigger_source: 'pattern',
      matched_key: 'low_mood',
      recommended_intervention_ids: ['dep_001', 'dep_002', 'dep_004'],
      explanation: 'Recommended to help counter withdrawal and build momentum through small daily actions.',
      priority: 75,
    },
    {
      rule_id: 'RULE_WORK_EXAM_PRESSURE',
      trigger_source: 'vocab',
      matched_key: 'pressure',
      recommended_intervention_ids: ['acd_001', 'acd_002', 'acd_003'],
      explanation: 'Recommended based on academic or work pressure indicators in your active cycle.',
      priority: 70,
    },
    {
      rule_id: 'RULE_PANIC_EARLY_WARNING',
      trigger_source: 'pattern',
      matched_key: 'panic',
      recommended_intervention_ids: ['pan_001', 'anx_003', 'str_002'],
      explanation: 'Recommended as quick-acting grounding techniques for physical stress or panic.',
      priority: 95,
    },
  ];

  /**
   * Deterministically calculates recommendations for a user based on snapshot data.
   */
  async getRecommendations(userId: string, limit = 5): Promise<RecommendationResponse> {
    console.log(`[RecommendationService] Generating deterministic recommendations for user ${userId}...`);

    // 1. Fetch user platform snapshots (Read-Only)
    const snapshots = await this.loadUserSnapshots(userId);

    const matchedResults: RecommendationResult[] = [];
    const seenInterventionIds = new Set<string>();

    // 2. Evaluate Rule Engine against User Snapshots
    for (const rule of this.rules) {
      let isMatch = false;

      if (rule.trigger_source === 'vocab') {
        isMatch = snapshots.vocabKeywords.some((k) => k.includes(rule.matched_key));
      } else if (rule.trigger_source === 'pattern') {
        isMatch = snapshots.patterns.some((p) => p.includes(rule.matched_key));
      } else if (rule.trigger_source === 'sleep') {
        isMatch = snapshots.hasSleepIssues;
      }

      if (isMatch) {
        for (const interventionId of rule.recommended_intervention_ids) {
          if (!seenInterventionIds.has(interventionId)) {
            const intervention = await this.interventionRepo.findByIdOrSlug(interventionId);
            if (intervention) {
              seenInterventionIds.add(interventionId);
              matchedResults.push({
                intervention,
                rule_id: rule.rule_id,
                matched_trigger: rule.matched_key,
                reason: rule.explanation,
                rank_score: rule.priority,
              });
            }
          }
        }
      }
    }

    // 3. Fallback to default foundation recommendations if snapshot triggers are quiet
    if (matchedResults.length < limit) {
      const defaultIds = ['anx_001', 'str_001', 'dep_002', 'anx_003', 'slp_001'];
      for (const id of defaultIds) {
        if (!seenInterventionIds.has(id)) {
          const intervention = await this.interventionRepo.findByIdOrSlug(id);
          if (intervention) {
            seenInterventionIds.add(id);
            matchedResults.push({
              intervention,
              rule_id: 'RULE_FOUNDATION_DEFAULT',
              matched_trigger: 'foundational_practice',
              reason: 'Foundational daily practice technique for overall emotional regulation.',
              rank_score: 50,
            });
          }
        }
      }
    }

    // Sort by rank_score descending
    const sorted = matchedResults.sort((a, b) => b.rank_score - a.rank_score).slice(0, limit);

    return {
      engine_version: RecommendationService.ENGINE_VERSION,
      recommended: sorted,
      inputs_evaluated: {
        vocab_keywords_count: snapshots.vocabKeywords.length,
        active_patterns_count: snapshots.patterns.length,
        completed_exercises_count: snapshots.completedExercisesCount,
        current_cycle_id: snapshots.currentCycleId,
      },
    };
  }

  /**
   * Deterministically returns Post-Journal Recommendation Groups.
   * - Core Daily Interventions ("Take a minute for yourself")
   * - Crisis Support Recommendations ("Extra support for moments like this", if isCrisis)
   * ZERO AI / ZERO LLM calls. 100% deterministic & fast.
   */
  async getPostJournalRecommendations(userId: string, isCrisis = false) {
    console.log(`[RecommendationService] Fetching post-journal recommendations for user ${userId} (isCrisis: ${isCrisis})`);

    // Configurable Recommendation Groups
    const coreDailyIds = ['anx_001', 'anx_003', 'str_002'];
    const crisisSupportIds = ['pan_001', 'slp_002', 'anx_005', 'pan_002'];

    const coreDailyItems: any[] = [];
    for (const id of coreDailyIds) {
      const item = await this.interventionRepo.findByIdOrSlug(id);
      if (item) coreDailyItems.push(item);
    }

    const crisisSupportItems: any[] = [];
    if (isCrisis) {
      for (const id of crisisSupportIds) {
        const item = await this.interventionRepo.findByIdOrSlug(id);
        if (item) crisisSupportItems.push(item);
      }
    }

    return {
      engine_version: RecommendationService.ENGINE_VERSION,
      is_crisis: isCrisis,
      groups: [
        {
          group_id: 'core_daily',
          title: 'Take a minute for yourself',
          subtitle: 'Small practices that may help you reset before moving on.',
          visible: true,
          interventions: coreDailyItems,
        },
        {
          group_id: 'crisis_support',
          title: 'Extra support for moments like this',
          subtitle: 'Gentle, evidence-based practices designed to ground and steady your body right now.',
          visible: isCrisis,
          interventions: crisisSupportItems,
        },
        {
          group_id: 'therapist_recommended',
          title: 'Therapist Recommended',
          subtitle: 'Curated by clinical advisors for daily resilience.',
          visible: false,
          interventions: [],
        },
        {
          group_id: 'personalised_recommendations',
          title: 'Personalised Recommendations',
          subtitle: 'Matched to your emotional reflection patterns.',
          visible: false,
          interventions: [],
        },
      ],
      core_daily: coreDailyItems,
      crisis_support: crisisSupportItems,
    };
  }

  /**
   * Safely loads read-only snapshot data for a user.
   */
  private async loadUserSnapshots(userId: string) {
    const vocabKeywords: string[] = [];
    const patterns: string[] = [];
    let hasSleepIssues = false;
    let completedExercisesCount = 0;
    let currentCycleId: string | undefined;

    try {
      // Fetch recent vocab snapshots
      const { data: vData } = await supabase
        .from('vocab_snapshots')
        .select('keywords')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (vData) {
        vData.forEach((row) => {
          if (Array.isArray(row.keywords)) {
            vocabKeywords.push(...row.keywords.map((k: string) => String(k).toLowerCase()));
          }
        });
      }

      // Fetch recent pattern snapshots
      const { data: pData } = await supabase
        .from('pattern_snapshots')
        .select('pattern_name, tags')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (pData) {
        pData.forEach((row) => {
          if (row.pattern_name) patterns.push(String(row.pattern_name).toLowerCase());
          if (Array.isArray(row.tags)) patterns.push(...row.tags.map((t: string) => String(t).toLowerCase()));
        });
      }

      // Check exercise instances
      const { count: exCount } = await supabase
        .from('exercise_instances')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (exCount) completedExercisesCount = exCount;

      // Check active cycle
      const { data: cycleData } = await supabase
        .from('cycles')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (cycleData) currentCycleId = cycleData.id;
    } catch (e) {
      console.warn('[RecommendationService] Snapshot load fallback (using empty snapshot defaults):', e);
    }

    if (vocabKeywords.some((k) => k.includes('sleep') || k.includes('insomnia') || k.includes('tired'))) {
      hasSleepIssues = true;
    }

    return {
      vocabKeywords,
      patterns,
      hasSleepIssues,
      completedExercisesCount,
      currentCycleId,
    };
  }
}
