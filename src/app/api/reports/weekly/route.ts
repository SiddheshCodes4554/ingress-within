import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

/**
 * GET /api/reports/weekly: Fetches all weekly reports for the authenticated user.
 * Pure read — never triggers report generation. Use /api/reports/backfill to generate.
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

    const userId = authUser.userId;
    const cycleId = request.nextUrl.searchParams.get('cycleId');
    const weekNumber = request.nextUrl.searchParams.get('weekNumber');

    // Non-blocking background audit to trigger generation for any missing reports without holding up the HTTP response
    const { backfillWeeklyReports } = await import('../../../../lib/weeklyReportBackfill');
    void backfillWeeklyReports(userId).catch(err => {
      console.error('[API Weekly Reports GET] Background backfill failed:', err.message);
    });

    // Fetch all weekly summaries for this user
    let query = supabase
      .from('weekly_summaries')
      .select('*')
      .eq('user_id', userId);

    if (cycleId) {
      query = query.eq('cycle_id', cycleId);
    }
    if (weekNumber) {
      const parsedWeek = parseInt(weekNumber);
      if (!isNaN(parsedWeek)) {
        query = query.eq('week_number', parsedWeek);
      }
    }

    const { data: reports, error: reportsErr } = await query.order('week_number', { ascending: true });

    if (reportsErr) {
      throw new Error(`Failed to fetch weekly summaries: ${reportsErr.message}`);
    }

    // Dynamic self-healing of historical report data structures
    const healedReports = await Promise.all(
      (reports || []).map(r => healReportData(r, supabase))
    );

    return NextResponse.json({
      success: true,
      reports: healedReports
    });

  } catch (error: any) {
    console.error('[API Weekly Reports GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}

async function healReportData(report: any, supabaseClient: any): Promise<any> {
  if (!report || !report.report_data) return report;

  const reportData = JSON.parse(JSON.stringify(report.report_data));
  const userId = report.user_id;
  const cycleId = report.cycle_id;
  const weekNumber = report.week_number;
  const dayStart = report.day_start || ((weekNumber - 1) * 7 + 1);
  const dayEnd = report.day_end || (weekNumber * 7);

  // 1. Format crisis_review summary (remove underscores)
  if (reportData.crisis_review?.summary) {
    reportData.crisis_review.summary = reportData.crisis_review.summary.replace(/_/g, ' ');
  }

  // 2. Heal vocabThisWeek if empty
  if (!reportData.vocabThisWeek || reportData.vocabThisWeek.length === 0) {
    try {
      const { data: dbEntries } = await supabaseClient
        .from('entries')
        .select('id')
        .eq('user_id', userId)
        .eq('cycle_id', cycleId)
        .gte('cycle_day', dayStart)
        .lte('cycle_day', dayEnd);

      const journalIds = (dbEntries || []).map((e: any) => e.id);
      
      if (journalIds.length > 0) {
        const { data: entryExts } = await supabaseClient
          .from('vocab_extractions')
          .select('normalized_word, word, confidence, sentence, created_at, entry_id')
          .eq('user_id', userId)
          .eq('cycle_id', cycleId)
          .in('entry_id', journalIds);

        if (entryExts && entryExts.length > 0) {
          const vocabMap = new Map<string, { word: string; freq: number; sentence: string }>();
          entryExts.forEach((ext: any) => {
            const norm = ext.normalized_word.toLowerCase();
            const existing = vocabMap.get(norm);
            if (existing) {
              existing.freq += 1;
            } else {
              vocabMap.set(norm, {
                word: ext.word,
                freq: 1,
                sentence: ext.sentence || ''
              });
            }
          });

          const healedVocab = Array.from(vocabMap.entries()).map(([norm, val]) => ({
            word: val.word,
            normalized_word: norm,
            frequency: val.freq,
            sentence: (val.sentence || '').substring(0, 100)
          })).sort((a, b: any) => b.frequency - a.frequency).slice(0, 10);

          reportData.vocabThisWeek = healedVocab;
        }
      }
    } catch (err) {
      console.error('[Heal Report Data] Error healing vocab:', err);
    }
  }

  // 3. Heal since_last_week comparison if week > 1 and it's empty or says "First week on record"
  const isFirstWeekMsg = !reportData.since_last_week || 
                         (typeof reportData.since_last_week === 'string' && reportData.since_last_week.includes('First week on record')) ||
                         (typeof reportData.since_last_week === 'object' && (!reportData.since_last_week.last_week_words || reportData.since_last_week.last_week_words.length === 0));

  if (weekNumber > 1 && isFirstWeekMsg) {
    try {
      const { data: prevSummary } = await supabaseClient
        .from('weekly_summaries')
        .select('*')
        .eq('user_id', userId)
        .eq('cycle_id', cycleId)
        .eq('week_number', weekNumber - 1)
        .maybeSingle();

      if (prevSummary) {
        const healedPrev = await healReportData(prevSummary, supabaseClient);
        const prevVocab = healedPrev?.report_data?.vocabThisWeek || [];
        const thisVocab = reportData.vocabThisWeek || [];

        if (prevVocab.length > 0 || thisVocab.length > 0) {
          const lastWords = prevVocab.slice(0, 3).map((v: any) => v.word);
          const thisWords = thisVocab.slice(0, 3).map((v: any) => v.word);
          
          reportData.since_last_week = {
            last_week_words: lastWords,
            this_week_words: thisWords
          };
        }
      }
    } catch (err) {
      console.error('[Heal Report Data] Error healing since_last_week:', err);
    }
  }

  return {
    ...report,
    report_data: reportData
  };
}
