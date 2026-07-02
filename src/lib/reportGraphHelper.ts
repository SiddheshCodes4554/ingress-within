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

    // 1. Fetch entries written during this week range with their scores
    const { data: dbEntries, error: entriesError } = await supabase
      .from('entries')
      .select('cycle_day, day_ei, day_pr, day_sa, created_at')
      .eq('cycle_id', cycleId)
      .eq('user_id', userId)
      .gte('cycle_day', dayStart)
      .lte('cycle_day', dayEnd);

    if (entriesError) {
      console.error(`[Overlay Graph Data] Error fetching entries: ${entriesError.message}`);
      return report;
    }

    // 2. Group by cycle_day and select final entry (latest created_at)
    const dailyMap = new Map<number, any>();
    (dbEntries || []).forEach((entry: any) => {
      const existing = dailyMap.get(entry.cycle_day);
      if (!existing || new Date(entry.created_at) >= new Date(existing.created_at)) {
        dailyMap.set(entry.cycle_day, entry);
      }
    });

    const entry_lengths: number[] = [];
    const rawScores: (number | null)[] = [];
    const eis: (number | null)[] = [];
    const sas: (number | null)[] = [];

    for (let i = 0; i < 7; i++) {
      const targetDay = dayStart + i;
      const entry = dailyMap.get(targetDay);

      if (entry && entry.day_ei !== null && entry.day_pr !== null && entry.day_sa !== null) {
        const ei = Number(entry.day_ei);
        const pr = Number(entry.day_pr);
        const sa = Number(entry.day_sa);
        const score = ei + pr + sa; // range 0 - 30
        const normalized = Math.round((score / 30) * 64);

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
