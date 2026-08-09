import { supabase } from './db';

/**
 * Dynamically computes Reflection Depth score bar heights and the score-trend
 * interpretation sentence, and overlays them onto the weekly summary's report_data.
 */
export async function overlayWeeklyReportGraphData(report: any, userId: string) {
  if (!report) return report;

  try {
    const cycleId = report.cycle_id;
    const dayStart = report.day_start || 1;
    const dayEnd = report.day_end || 7;

    // 1. Fetch cycle details to get start date
    const { data: cycle, error: cycleErr } = await supabase
      .from('cycles')
      .select('*')
      .eq('id', cycleId)
      .eq('user_id', userId)
      .single();

    if (cycleErr || !cycle) {
      console.error(`[Overlay Graph Data] Failed to fetch cycle details: ${cycleErr?.message}`);
      return report;
    }

    // Find the timestamp of the user's first completed journal entry in this cycle
    const { data: firstEntry } = await supabase
      .from('entries')
      .select('created_at')
      .eq('user_id', userId)
      .eq('cycle_id', cycleId)
      .neq('entry_type', 'empty')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    let cycleStartDate: Date;
    if (firstEntry && firstEntry.created_at) {
      const startPart = firstEntry.created_at.split('T')[0];
      const [year, month, day] = startPart.split('-').map(Number);
      cycleStartDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    } else {
      const startPart = (cycle.start_date || cycle.started_at || cycle.created_at).split('T')[0];
      const [year, month, day] = startPart.split('-').map(Number);
      cycleStartDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }

    const weekNumber = report.week_number || 1;
    const week_start_date = new Date(cycleStartDate.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
    const week_next_start_date = new Date(cycleStartDate.getTime() + weekNumber * 7 * 24 * 60 * 60 * 1000);

    // 2. Fetch entries written for this cycle and week by cycle_day (authoritative)
    const { data: dbEntries, error: entriesError } = await supabase
      .from('entries')
      .select('id, day_ei, day_pr, day_sa, created_at, cycle_day, word_count, content, entry_type')
      .eq('cycle_id', cycleId)
      .eq('user_id', userId)
      .gte('cycle_day', dayStart)
      .lte('cycle_day', dayEnd);

    if (entriesError) {
      console.error(`[Overlay Graph Data] Error fetching entries: ${entriesError.message}`);
      return report;
    }

    // 3. Map entries by cycle_day first, with fallback to date string
    const dailyMap = new Map<string, any>();
    (dbEntries || []).forEach((entry: any) => {
      const entryDateStr = new Date(entry.created_at).toISOString().split('T')[0];
      const existing = dailyMap.get(entryDateStr);
      if (!existing || new Date(entry.created_at) >= new Date(existing.created_at)) {
        dailyMap.set(entryDateStr, entry);
      }
    });

    const entry_lengths: number[] = [];
    const rawScores: (number | null)[] = [];
    const eis: (number | null)[] = [];
    const sas: (number | null)[] = [];

    for (let i = 0; i < 7; i++) {
      const targetCycleDay = dayStart + i;
      const targetDate = new Date(week_start_date.getTime() + i * 24 * 60 * 60 * 1000);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      let entry = (dbEntries || []).find((e: any) => e.cycle_day === targetCycleDay && e.entry_type !== 'empty');
      if (!entry) {
        entry = dailyMap.get(targetDateStr);
      }
      if (entry && entry.entry_type === 'empty') {
        entry = undefined;
      }

      if (entry) {
        let ei: number;
        let pr: number;
        let sa: number;
        let score: number;

        if (entry.day_ei !== null && entry.day_pr !== null && entry.day_sa !== null) {
          ei = Number(entry.day_ei);
          pr = Number(entry.day_pr);
          sa = Number(entry.day_sa);
          score = ei + pr + sa;
        } else {
          // Fallback score estimation based on word count / content length when day scores are null
          const wordCount = entry.word_count || (entry.content ? entry.content.split(/\s+/).filter(Boolean).length : 0);
          score = Math.min(27, Math.max(12, Math.round(12 + Math.min(15, wordCount * 0.25))));
          ei = Math.round(score / 3);
          pr = Math.round(score / 3);
          sa = score - ei - pr;
        }

        const normalized = Math.max(20, Math.round((score / 30) * 100));

        entry_lengths.push(normalized);
        rawScores.push(score);
        eis.push(ei);
        sas.push(sa);
      } else {
        entry_lengths.push(0);
        rawScores.push(null);
        eis.push(null);
        sas.push(null);
      }
    }

    // 3. Trend analysis to generate dynamic interpretation
    const validScores = rawScores.filter((s): s is number => s !== null);
    const validEIs = eis.filter((e): e is number => e !== null);
    const k = validScores.length;

    let consistency = 'No reflection data recorded this week.';

    if (k === 1) {
      consistency = 'Single reflection entry logged this week.';
    } else if (k >= 2) {
      const firstTwoEI = validEIs.slice(0, 2);
      const lastTwoEI = validEIs.slice(-2);
      const avgFirstEI = firstTwoEI.reduce((sum, e) => sum + e, 0) / firstTwoEI.length;
      const avgLastEI = lastTwoEI.reduce((sum, e) => sum + e, 0) / lastTwoEI.length;

      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let j = 0; j < k; j++) {
        sumX += j;
        sumY += validScores[j];
        sumXY += j * validScores[j];
        sumXX += j * j;
      }
      const slope = (k * sumXX - sumX * sumX) !== 0 
        ? (k * sumXY - sumX * sumY) / (k * sumXX - sumX * sumX)
        : 0;

      const maxVal = Math.max(...validScores);
      const maxIdx = validScores.indexOf(maxVal);
      const isMidweek = maxIdx > 0 && maxIdx < k - 1;
      const isPeak = isMidweek && maxVal >= Math.max(validScores[0], validScores[k - 1]) + 3;

      const minVal = Math.min(...validScores);
      const isConsistent = (maxVal - minVal) <= 3;

      if (validEIs.length >= 4 && avgFirstEI >= 6.5 && avgLastEI <= 4.5) {
        consistency = 'After an emotionally intense beginning, your writing gradually became calmer.';
      } else if (slope >= 0.75) {
        consistency = 'Your reflections became progressively deeper throughout the week.';
      } else if (isPeak) {
        consistency = 'Your strongest emotional processing occurred midweek.';
      } else if (isConsistent) {
        consistency = 'Your reflection depth remained consistent across the week.';
      } else {
        consistency = 'Reflection depth fluctuated, suggesting changing emotional engagement.';
      }
    }

    // 4. Inject back into report_data structure safely
    if (!report.report_data) {
      report.report_data = {};
    }
    if (!report.report_data.writing_behaviour) {
      report.report_data.writing_behaviour = {};
    }
    
    report.report_data.writing_behaviour.entry_lengths = entry_lengths;
    report.report_data.writing_behaviour.consistency = consistency;
  } catch (err: any) {
    console.error(`[Overlay Graph Data] Unexpected error:`, err.message);
  }

  return report;
}
