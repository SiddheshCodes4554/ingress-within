import { supabase } from '../db';
import {
  ModuleProgressRecord,
  TouchCompletionRecord,
  ModuleAnswerRecord,
  MhpiResponseRecord,
  CompleteUserModuleState
} from '../../types/moduleProgress';
import { ModuleContentService } from './moduleContentService';

// Fallback in-memory persistence store indexed by key `${userId}:${moduleId}`
const IN_MEMORY_PROGRESS_STORE: Record<string, CompleteUserModuleState> = {};

export class ModuleProgressService {
  private static getMemoryStateKey(userId: string, moduleId: string): string {
    return `${userId.trim()}:${moduleId.trim().toUpperCase()}`;
  }

  private static getOrCreateMemoryState(userId: string, moduleId: string): CompleteUserModuleState {
    const key = this.getMemoryStateKey(userId, moduleId);
    if (!IN_MEMORY_PROGRESS_STORE[key]) {
      IN_MEMORY_PROGRESS_STORE[key] = {
        progress: null,
        completedTouches: [],
        answers: {},
        mhpi: {
          baseline: null,
          weekly: {},
          end: null
        }
      };
    }
    return IN_MEMORY_PROGRESS_STORE[key];
  }

  /**
   * Fetches the complete persisted module state for a user and module.
   */
  public static async getFullUserModuleState(userId: string, moduleId: string): Promise<CompleteUserModuleState> {
    const memState = this.getOrCreateMemoryState(userId, moduleId);

    try {
      // 1. Fetch Progress Record
      const { data: progressData, error: progressErr } = await supabase
        .from('module_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .single();

      if (!progressErr && progressData) {
        memState.progress = progressData as ModuleProgressRecord;
      }

      // 2. Fetch Completed Touches
      const { data: completionsData, error: completionsErr } = await supabase
        .from('module_touch_completions')
        .select('touch_id')
        .eq('user_id', userId)
        .eq('module_id', moduleId);

      if (!completionsErr && completionsData) {
        memState.completedTouches = completionsData.map(c => c.touch_id);
      }

      // 3. Fetch Answers
      const { data: answersData, error: answersErr } = await supabase
        .from('module_answers')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId);

      if (!answersErr && answersData) {
        const answersMap: Record<string, Record<string, any>> = {};
        for (const row of answersData) {
          if (!answersMap[row.touch_id]) answersMap[row.touch_id] = {};
          answersMap[row.touch_id][row.step_key] = row.answer_data;
        }
        memState.answers = answersMap;
      }

      // 4. Fetch MHPI Responses
      const { data: mhpiData, error: mhpiErr } = await supabase
        .from('module_mhpi_responses')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId);

      if (!mhpiErr && mhpiData) {
        for (const row of mhpiData) {
          if (row.assessment_type === 'baseline') {
            memState.mhpi.baseline = row as MhpiResponseRecord;
          } else if (row.assessment_type === 'end') {
            memState.mhpi.end = row as MhpiResponseRecord;
          } else if (row.assessment_type === 'weekly' && row.week_number) {
            memState.mhpi.weekly[`w${row.week_number}`] = row as MhpiResponseRecord;
          }
        }
      }
    } catch (err) {
      console.warn('[ModuleProgressService] DB query exception, using in-memory state:', err);
    }

    return memState;
  }

  /**
   * Updates overall module progress (status, current_week, current_touch_id, completed_at).
   */
  public static async updateProgress(
    userId: string,
    moduleId: string,
    updates: Partial<Pick<ModuleProgressRecord, 'status' | 'current_week' | 'current_touch_id' | 'completed_at'>>
  ): Promise<ModuleProgressRecord> {
    const memState = this.getOrCreateMemoryState(userId, moduleId);

    const now = new Date().toISOString();
    const updatedRecord: ModuleProgressRecord = {
      id: memState.progress?.id || `prog_${Date.now()}`,
      user_id: userId,
      module_id: moduleId,
      status: updates.status || memState.progress?.status || 'active',
      current_week: updates.current_week ?? memState.progress?.current_week ?? 1,
      current_touch_id: updates.current_touch_id !== undefined ? updates.current_touch_id : (memState.progress?.current_touch_id || null),
      completed_at: updates.completed_at !== undefined ? updates.completed_at : (memState.progress?.completed_at || null),
      created_at: memState.progress?.created_at || now,
      updated_at: now
    };

    memState.progress = updatedRecord;

    try {
      const { data, error } = await supabase
        .from('module_progress')
        .upsert(
          {
            user_id: userId,
            module_id: moduleId,
            status: updatedRecord.status,
            current_week: updatedRecord.current_week,
            current_touch_id: updatedRecord.current_touch_id,
            completed_at: updatedRecord.completed_at,
            updated_at: now
          },
          { onConflict: 'user_id,module_id' }
        )
        .select()
        .single();

      if (!error && data) {
        memState.progress = data as ModuleProgressRecord;
      }
    } catch (err) {
      console.warn('[ModuleProgressService] DB upsert progress failed, fallback to memory:', err);
    }

    return memState.progress;
  }

  /**
   * Validates and records touch completion.
   * Format C techniques do NOT record completion tracking.
   * Server validates touch exists in module.
   */
  public static async recordTouchCompletion(
    userId: string,
    moduleId: string,
    touchId: string
  ): Promise<{ success: boolean; completedTouches: string[]; error?: string }> {
    const content = ModuleContentService.getModuleContent(moduleId);
    if (!content) {
      return { success: false, completedTouches: [], error: `Module '${moduleId}' not found.` };
    }

    // Check touch exists in content
    const touch = ModuleContentService.getModuleTouch(moduleId, touchId);
    if (!touch) {
      // Check if it's a technique or format C
      const isFormatC = content.brief.mechanisms.some(m =>
        m.techniques.some(t => t.code === touchId && t.format === 'C')
      );
      if (isFormatC) {
        return {
          success: false,
          completedTouches: this.getOrCreateMemoryState(userId, moduleId).completedTouches,
          error: 'Format C reference-only techniques do not record completion tracking per developer guide.'
        };
      }
      return { success: false, completedTouches: [], error: `Touch '${touchId}' does not belong to module '${moduleId}'.` };
    }

    const memState = this.getOrCreateMemoryState(userId, moduleId);

    if (!memState.completedTouches.includes(touchId)) {
      memState.completedTouches.push(touchId);
    }

    try {
      const { error } = await supabase
        .from('module_touch_completions')
        .upsert(
          {
            user_id: userId,
            module_id: moduleId,
            touch_id: touchId,
            completed_at: new Date().toISOString()
          },
          { onConflict: 'user_id,module_id,touch_id' }
        );

      if (error) {
        console.warn('[ModuleProgressService] DB upsert touch completion failed, using memory:', error.message);
      }
    } catch (err) {
      console.warn('[ModuleProgressService] Touch completion DB exception:', err);
    }

    return { success: true, completedTouches: memState.completedTouches };
  }

  /**
   * Autosaves user answer for a touch step.
   * Format C techniques do NOT save user answers.
   */
  public static async saveAnswer(
    userId: string,
    moduleId: string,
    touchId: string,
    stepKey: string,
    answerData: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    const content = ModuleContentService.getModuleContent(moduleId);
    if (!content) {
      return { success: false, error: `Module '${moduleId}' not found.` };
    }

    // Check if it's a Format C technique
    const isFormatC = content.brief.mechanisms.some(m =>
      m.techniques.some(t => t.code === touchId && t.format === 'C')
    );
    if (isFormatC) {
      return { success: false, error: 'Format C reference-only techniques do not record user answers per developer guide.' };
    }

    const memState = this.getOrCreateMemoryState(userId, moduleId);
    if (!memState.answers[touchId]) memState.answers[touchId] = {};
    memState.answers[touchId][stepKey] = answerData;

    try {
      const { error } = await supabase
        .from('module_answers')
        .upsert(
          {
            user_id: userId,
            module_id: moduleId,
            touch_id: touchId,
            step_key: stepKey,
            answer_data: answerData,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,module_id,touch_id,step_key' }
        );

      if (error) {
        console.warn('[ModuleProgressService] DB upsert answer failed, using memory:', error.message);
      }
    } catch (err) {
      console.warn('[ModuleProgressService] Answer DB exception:', err);
    }

    return { success: true };
  }

  /**
   * Saves MHPI baseline, weekly, or end assessment response.
   */
  public static async saveMhpiResponse(
    userId: string,
    moduleId: string,
    assessmentType: 'baseline' | 'weekly' | 'end',
    responses: Record<string, any>,
    severityScore?: number,
    weekNumber?: number,
    improvementPct?: number
  ): Promise<{ success: boolean; record: MhpiResponseRecord }> {
    const memState = this.getOrCreateMemoryState(userId, moduleId);

    const now = new Date().toISOString();
    const newRecord: MhpiResponseRecord = {
      id: `mhpi_${Date.now()}`,
      user_id: userId,
      module_id: moduleId,
      assessment_type: assessmentType,
      week_number: weekNumber || null,
      responses,
      severity_score: severityScore ?? null,
      improvement_pct: improvementPct ?? null,
      created_at: now,
      updated_at: now
    };

    if (assessmentType === 'baseline') {
      memState.mhpi.baseline = newRecord;
    } else if (assessmentType === 'end') {
      memState.mhpi.end = newRecord;
    } else if (assessmentType === 'weekly' && weekNumber) {
      memState.mhpi.weekly[`w${weekNumber}`] = newRecord;
    }

    try {
      const { data, error } = await supabase
        .from('module_mhpi_responses')
        .insert({
          user_id: userId,
          module_id: moduleId,
          assessment_type: assessmentType,
          week_number: weekNumber || null,
          responses,
          severity_score: severityScore ?? null,
          improvement_pct: improvementPct ?? null
        })
        .select()
        .single();

      if (!error && data) {
        if (assessmentType === 'baseline') memState.mhpi.baseline = data as MhpiResponseRecord;
        else if (assessmentType === 'end') memState.mhpi.end = data as MhpiResponseRecord;
        else if (assessmentType === 'weekly' && weekNumber) memState.mhpi.weekly[`w${weekNumber}`] = data as MhpiResponseRecord;
      }
    } catch (err) {
      console.warn('[ModuleProgressService] DB save MHPI response failed, using memory:', err);
    }

    return { success: true, record: newRecord };
  }
}
