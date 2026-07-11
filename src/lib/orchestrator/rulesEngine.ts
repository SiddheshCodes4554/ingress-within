import { supabase } from '../db';

export interface OrchestratorContext {
  enqueueJob: (userId: string, engine: string, triggerKey: string) => Promise<string>;
  emitEvent: (userId: string, eventType: string, payload: any) => Promise<void>;
  queueRegistry: any;
}

export interface OrchestrationRule {
  name: string;
  triggerEvent: string;
  conditions: (userId: string, payload: any) => Promise<boolean>;
  action: (userId: string, payload: any, ctx: OrchestratorContext) => Promise<void>;
}

export const ORCHESTRATION_RULES: OrchestrationRule[] = [
  // 1. JournalSubmitted -> Crisis Detection scan
  {
    name: 'JournalSubmitted -> Crisis Detection',
    triggerEvent: 'JournalSubmitted',
    conditions: async () => true,
    action: async (userId, payload, ctx) => {
      const jobId = await ctx.enqueueJob(userId, 'crisis_detection', `JournalSubmitted:${payload.entry_id}`);
      await ctx.queueRegistry.addJob('crisis_detection', `crisis_${payload.entry_id}`, {
        entry_id: payload.entry_id,
        user_id: userId,
        orchestrator_job_id: jobId
      });
    }
  },

  // 2. CrisisDetected (crisis flag true) -> Suppress Reflection
  {
    name: 'CrisisDetected -> Suppress Reflection',
    triggerEvent: 'CrisisDetected',
    conditions: async (userId, payload) => payload.has_crisis === true,
    action: async (userId, payload, ctx) => {
      console.log(`[RulesEngine] Crisis detected for entry ${payload.entry_id}. Suppressing reflection.`);
      await ctx.emitEvent(userId, 'ReflectionCompleted', {
        entry_id: payload.entry_id,
        cycle_id: payload.cycle_id,
        bypassed: true
      });
    }
  },

  // 3. CrisisDetected (crisis flag false) -> Queue Reflection
  {
    name: 'CrisisDetected -> Queue Reflection',
    triggerEvent: 'CrisisDetected',
    conditions: async (userId, payload) => payload.has_crisis === false,
    action: async (userId, payload, ctx) => {
      const jobId = await ctx.enqueueJob(userId, 'reflection', `CrisisDetected:${payload.entry_id}`);
      await ctx.queueRegistry.addJob('reflection_generation', `refl_${payload.entry_id}`, {
        entry_id: payload.entry_id,
        user_id: userId,
        orchestrator_job_id: jobId
      });
    }
  },

  // 4. ReflectionCompleted -> Queue Vocabulary (if not already updated)
  {
    name: 'ReflectionCompleted -> Queue Vocabulary',
    triggerEvent: 'ReflectionCompleted',
    conditions: async (userId, payload) => {
      const { data } = await supabase
        .from('orchestrator_jobs')
        .select('id')
        .eq('user_id', userId)
        .eq('engine', 'vocabulary')
        .eq('trigger', `ReflectionCompleted:${payload.entry_id}`)
        .eq('status', 'completed');
      return !data || data.length === 0;
    },
    action: async (userId, payload, ctx) => {
      const jobId = await ctx.enqueueJob(userId, 'vocabulary', `ReflectionCompleted:${payload.entry_id}`);
      await ctx.queueRegistry.addJob('vocab_processing', `vocab_${payload.entry_id}`, {
        entry_id: payload.entry_id,
        user_id: userId,
        orchestrator_job_id: jobId
      });
    }
  },

  // 5. VocabularyCompleted -> Queue Weekly Report (if milestone due and report is missing)
  {
    name: 'VocabularyCompleted -> Queue Weekly Report',
    triggerEvent: 'VocabularyCompleted',
    conditions: async (userId, payload) => {
      if (!payload.entry_id) return false;
      const { data: entry } = await supabase
        .from('entries')
        .select('cycle_id, cycle_day')
        .eq('id', payload.entry_id)
        .maybeSingle();
      if (!entry || !entry.cycle_id) return false;

      const weeksToCheck = [
        { weekNum: 3, triggerDay: 22, startDay: 15, endDay: 21 },
        { weekNum: 2, triggerDay: 15, startDay: 8, endDay: 14 },
        { weekNum: 1, triggerDay: 8, startDay: 1, endDay: 7 }
      ];
      const dueWeek = weeksToCheck.find(w => entry.cycle_day >= w.triggerDay);
      if (!dueWeek) return false;

      // Check if weekly summary is missing
      const { data: existing } = await supabase
        .from('weekly_summaries')
        .select('id')
        .eq('cycle_id', entry.cycle_id)
        .eq('week_number', dueWeek.weekNum)
        .maybeSingle();

      return !existing;
    },
    action: async (userId, payload, ctx) => {
      const weeksToCheck = [
        { weekNum: 3, triggerDay: 22, startDay: 15, endDay: 21 },
        { weekNum: 2, triggerDay: 15, startDay: 8, endDay: 14 },
        { weekNum: 1, triggerDay: 8, startDay: 1, endDay: 7 }
      ];
      const { data: entry } = await supabase
        .from('entries')
        .select('cycle_id, cycle_day')
        .eq('id', payload.entry_id)
        .maybeSingle();

      if (!entry) return;

      const dueWeek = weeksToCheck.find(w => entry.cycle_day >= w.triggerDay);
      if (!dueWeek) return;

      const { data: insertedSummary } = await supabase
        .from('weekly_summaries')
        .insert({
          user_id: userId,
          cycle_id: entry.cycle_id,
          week_number: dueWeek.weekNum,
          day_start: dueWeek.startDay,
          day_end: dueWeek.endDay,
          status: 'PENDING'
        })
        .select('id')
        .single();

      if (insertedSummary) {
        const jobId = await ctx.enqueueJob(userId, 'weekly_report', `VocabularyCompleted:${payload.entry_id}`);
        await ctx.queueRegistry.addJob('weekly_summary_generation', `weekly_validate_${insertedSummary.id}`, {
          summary_id: insertedSummary.id,
          cycle_id: entry.cycle_id,
          user_id: userId,
          week_number: dueWeek.weekNum,
          is_validation_job: true,
          orchestrator_job_id: jobId
        });
      }
    }
  },

  // 6. VocabularyCompleted -> Queue Patterns directly (if week not finished or report exists)
  {
    name: 'VocabularyCompleted -> Queue Patterns',
    triggerEvent: 'VocabularyCompleted',
    conditions: async (userId, payload) => {
      if (!payload.entry_id) return true;
      const { data: entry } = await supabase
        .from('entries')
        .select('cycle_id, cycle_day')
        .eq('id', payload.entry_id)
        .maybeSingle();
      if (!entry || !entry.cycle_id) return true;

      const weeksToCheck = [
        { weekNum: 3, triggerDay: 22, startDay: 15, endDay: 21 },
        { weekNum: 2, triggerDay: 15, startDay: 8, endDay: 14 },
        { weekNum: 1, triggerDay: 8, startDay: 1, endDay: 7 }
      ];
      const dueWeek = weeksToCheck.find(w => entry.cycle_day >= w.triggerDay);
      if (!dueWeek) return true;

      const { data: existing } = await supabase
        .from('weekly_summaries')
        .select('id')
        .eq('cycle_id', entry.cycle_id)
        .eq('week_number', dueWeek.weekNum)
        .maybeSingle();

      return !!existing;
    },
    action: async (userId, payload, ctx) => {
      const jobId = await ctx.enqueueJob(userId, 'patterns', `VocabularyCompleted:${payload.entry_id}`);
      await ctx.queueRegistry.addJob('pattern_processing', `pattern_journal_${payload.entry_id || Date.now()}`, {
        entry_id: payload.entry_id || undefined,
        user_id: userId,
        cycle_id: payload.cycle_id,
        source_type: payload.entry_id ? 'journal' : 'thread',
        orchestrator_job_id: jobId
      });
    }
  },

  // 7. WeeklyReportCompleted -> Queue Pattern Engine
  {
    name: 'WeeklyReportCompleted -> Queue Patterns',
    triggerEvent: 'WeeklyReportCompleted',
    conditions: async () => true,
    action: async (userId, payload, ctx) => {
      const jobId = await ctx.enqueueJob(userId, 'patterns', `WeeklyReportCompleted:${payload.summary_id}`);
      await ctx.queueRegistry.addJob('pattern_processing', `pattern_weekly_${payload.summary_id}`, {
        entry_id: payload.summary_id,
        user_id: userId,
        cycle_id: payload.cycle_id,
        source_type: 'weekly_report',
        orchestrator_job_id: jobId
      });
    }
  },

  // 8. PatternCompleted -> Queue Knowledge Engine
  {
    name: 'PatternCompleted -> Queue Knowledge',
    triggerEvent: 'PatternCompleted',
    conditions: async () => true,
    action: async (userId, payload, ctx) => {
      const resourceId = payload.weekly_summary_id || payload.entry_id || 'global';
      const jobId = await ctx.enqueueJob(userId, 'knowledge', `PatternCompleted:${resourceId}`);
      await ctx.queueRegistry.addJob('knowledge_processing', `knowledge_event_${resourceId}`, {
        event_id: resourceId,
        user_id: userId,
        cycle_id: payload.cycle_id,
        orchestrator_job_id: jobId
      });
    }
  },

  // 9. KnowledgeCompleted -> Queue Assessment (if assessment overdue)
  {
    name: 'KnowledgeCompleted -> Queue Assessment',
    triggerEvent: 'KnowledgeCompleted',
    conditions: async (userId, payload) => {
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!activeCycle) return false;

      const { data: maxEntry } = await supabase
        .from('entries')
        .select('cycle_day')
        .eq('user_id', userId)
        .eq('cycle_id', activeCycle.id)
        .order('cycle_day', { ascending: false })
        .limit(1)
        .maybeSingle();

      const cycleDay = maxEntry?.cycle_day || 0;
      if (cycleDay < 30) return false;

      const { data: existingAssessment } = await supabase
        .from('assessments')
        .select('id')
        .eq('cycle_id', activeCycle.id)
        .maybeSingle();

      return !existingAssessment;
    },
    action: async (userId, payload, ctx) => {
      const { data: activeCycle } = await supabase
        .from('cycles')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (!activeCycle) return;

      const { count } = await supabase
        .from('assessments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      const monthNum = (count || 0) + 1;

      const { data: assessment } = await supabase
        .from('assessments')
        .insert({
          user_id: userId,
          cycle_id: activeCycle.id,
          generation_status: 'pending',
          unlocked_at: new Date().toISOString(),
          ei_avg: 0,
          pr_avg: 0,
          sa_avg: 0,
          dt_score: 0,
          normalised_sa: 0,
          risk_total: 0,
          path_assignment: 'second_cycle',
          branch_assignment: 'A',
          entry_count: 0
        })
        .select()
        .single();

      if (assessment) {
        const jobId = await ctx.enqueueJob(userId, 'assessment', `KnowledgeCompleted:${activeCycle.id}`);
        await ctx.queueRegistry.addJob('monthly_report_generation', `assessment_${assessment.id}`, {
          cycle_id: activeCycle.id,
          user_id: userId,
          assessment_id: assessment.id,
          month_number: monthNum,
          orchestrator_job_id: jobId
        });
      }
    }
  },

  // 10. AssessmentCompleted -> Queue Exercise Engine
  {
    name: 'AssessmentCompleted -> Queue Exercise Engine',
    triggerEvent: 'AssessmentCompleted',
    conditions: async () => true,
    action: async (userId, payload, ctx) => {
      const jobId = await ctx.enqueueJob(userId, 'exercise', `AssessmentCompleted:${payload.assessment_id}`);
      await ctx.queueRegistry.addJob('exercise_insight_generation', `exercise_${payload.assessment_id}`, {
        exercise_id: payload.assessment_id,
        user_id: userId,
        orchestrator_job_id: jobId
      });
    }
  }
];
