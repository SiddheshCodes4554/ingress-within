import { supabase } from './db';
import { decrypt } from './encryption';

export interface WeeklyReportCollectorInput {
  userId: string;
  cycleId: string;
  weekNumber: number;
  dayStart: number;
  dayEnd: number;
}

export interface CollectedEntry {
  cycle_day: number;
  content: string;
  word_count: number;
  day_ei: number | null;
  day_pr: number | null;
  day_sa: number | null;
  reflection_question: string | null;
  reflection_answer: string | null;
}

export interface CollectedThreadResponse {
  response_text: string;
  question: string;
}

export interface CollectedVocabWord {
  word: string;
  normalized_word: string;
  frequency: number;
  sentence: string;
}

export interface CollectedCrisisEvent {
  id: string;
  crisis_type: string;
  timestamp: string;
}

export interface CollectedOpenThread {
  question: string;
  status: string;
}

export interface WeeklyReportData {
  weekly_stats: {
    entries_completed: number;
    total_possible: number;
    skipped_days: number;
    skipped_day_numbers: number[];
    writing_streak: number;
    thread_responses_completed: number;
    week_range: string;
    cycle_number: number;
    week_number: number;
    expected_days?: number;
    completed_days?: number;
    missed_dates?: string[];
    perfect_streak?: boolean;
  };
  entries: CollectedEntry[];
  threadResponses: CollectedThreadResponse[];
  vocabThisWeek: CollectedVocabWord[];
  vocabulary_evolution: {
    new_expressions: string[];
    growing_expressions: string[];
    declining_expressions: string[];
  };
  scores: { cycle_day: number; ei: number | null; pr: number | null; sa: number | null }[];
  crisisEvents: CollectedCrisisEvent[];
  openThreads: CollectedOpenThread[];
  writing_behaviour: {
    avg_entry_length: number;
    entry_lengths: number[];
    writing_times: string[];
    reflection_completion_rate: number;
    thread_completion_rate: number;
    skipped_days: number[];
    consistency?: string;
  };
  personalityContext: string | null;
  audit?: {
    week_number: number;
    week_start: string;
    week_end: string;
    expected_dates: string[];
    journal_ids_included: string[];
    journal_dates_included: string[];
    skipped_dates: string[];
    score_sources: { entry_id: string; date: string; ei: number | null; pr: number | null; sa: number | null }[];
    vocab_sources: { entry_id: string; date: string; words: string[] }[];
  };
}

/**
 * Collects all real user data for a specific cycle and week range.
 * This runs completely server-side and draws from the entire database history.
 */
export async function collectWeeklyReportData(input: WeeklyReportCollectorInput): Promise<WeeklyReportData> {
  const { userId, cycleId, weekNumber, dayStart } = input;

  // 1. Fetch Cycle Information (Scoped by user_id)
  const { data: cycle, error: cycleErr } = await supabase
    .from('cycles')
    .select('*')
    .eq('id', cycleId)
    .eq('user_id', userId)
    .single();

  if (cycleErr || !cycle) {
    throw new Error(`Failed to fetch cycle details for ID ${cycleId}: ${cycleErr?.message}`);
  }

  const cycleNumber = cycle.cycle_number !== undefined ? cycle.cycle_number : (cycle.number || 1);
  
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
    // Fallback if no entries yet (never sign up/login/onboarding)
    const startPart = (cycle.start_date || cycle.started_at || cycle.created_at).split('T')[0];
    const [year, month, day] = startPart.split('-').map(Number);
    cycleStartDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }

  // Compute fixed 7-day calendar window boundaries
  const week_start_date = new Date(cycleStartDate.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
  const week_end_date = new Date(cycleStartDate.getTime() + (weekNumber * 7 - 1) * 24 * 60 * 60 * 1000);
  const week_next_start_date = new Date(cycleStartDate.getTime() + weekNumber * 7 * 24 * 60 * 60 * 1000);

  // Format week range strictly using UTC timezone to prevent local shifts
  const weekRange = `${week_start_date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })} – ${week_end_date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}`;

  // 2. Fetch User Personality Context
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('personality_summary_text')
    .eq('id', userId)
    .single();

  let personalityContext = user?.personality_summary_text || null;
  if (personalityContext && personalityContext.length > 350) {
    personalityContext = personalityContext.substring(0, 350) + '... [truncated]';
  }

  // 3. Fetch Weekly Entries (joining reflections) strictly in the date range
  const { data: dbEntries, error: entriesErr } = await supabase
    .from('entries')
    .select('*, reflections(*)')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId)
    .gte('created_at', week_start_date.toISOString())
    .lt('created_at', week_next_start_date.toISOString())
    .order('created_at', { ascending: true });

  if (entriesErr) {
    throw new Error(`Failed to fetch weekly entries: ${entriesErr.message}`);
  }

  // Map entries by YYYY-MM-DD string to ensure exactly one entry per calendar day
  const dateToEntry = new Map<string, any>();
  (dbEntries || []).forEach(entry => {
    const entryDateStr = new Date(entry.created_at).toISOString().split('T')[0];
    const existing = dateToEntry.get(entryDateStr);
    // Dedup: keep the latest entry for each day
    if (!existing || new Date(entry.created_at) >= new Date(existing.created_at)) {
      dateToEntry.set(entryDateStr, entry);
    }
  });

  const entries: CollectedEntry[] = [];
  const skippedDayNumbers: number[] = [];
  const missedDates: string[] = [];
  const weekDates: Date[] = [];

  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(week_start_date.getTime() + i * 24 * 60 * 60 * 1000);
    weekDates.push(targetDate);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const entry = dateToEntry.get(targetDateStr);

    if (entry) {
      let text = decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv) || entry.content || '';
      if (text.length > 200) {
        text = text.substring(0, 200) + '... [truncated]';
      }
      
      const rawReflection = entry.reflections;
      const reflection = Array.isArray(rawReflection)
        ? (rawReflection[0] || null)
        : (rawReflection || null);

      entries.push({
        cycle_day: dayStart + i,
        content: text,
        word_count: entry.word_count || text.split(/\s+/).filter(Boolean).length || 0,
        day_ei: entry.day_ei !== null ? Number(entry.day_ei) : null,
        day_pr: entry.day_pr !== null ? Number(entry.day_pr) : null,
        day_sa: entry.day_sa !== null ? Number(entry.day_sa) : null,
        reflection_question: reflection?.closing_question || null,
        reflection_answer: (reflection?.status === 'completed' && reflection?.reflection_answer) ? reflection.reflection_answer : null
      });
    } else {
      skippedDayNumbers.push(dayStart + i);
      missedDates.push(targetDateStr);
    }
  }

  const entriesCompleted = entries.length;
  const totalPossible = 7;
  const skippedDays = skippedDayNumbers.length;

  // Calculate Streak using calendar dates up to the end of the week (scoped by user_id)
  const { data: allCycleEntries } = await supabase
    .from('entries')
    .select('created_at')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId)
    .lt('created_at', week_next_start_date.toISOString())
    .order('created_at', { ascending: false });

  const cycleDatesWritten = new Set(
    (allCycleEntries || []).map(e => new Date(e.created_at).toISOString().split('T')[0])
  );

  let writingStreak = 0;
  let currentStreakDate = new Date(week_end_date);
  while (true) {
    const dateStr = currentStreakDate.toISOString().split('T')[0];
    if (cycleDatesWritten.has(dateStr)) {
      writingStreak++;
      currentStreakDate.setTime(currentStreakDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  // 4. Fetch Thread Responses written this calendar week (scoped by user_id and cycle_id via inner join)
  const { data: dbResponses, error: responsesErr } = await supabase
    .from('thread_responses')
    .select('*, threads!inner(closing_question, cycle_id)')
    .eq('user_id', userId)
    .eq('threads.cycle_id', cycleId)
    .gte('created_at', week_start_date.toISOString())
    .lt('created_at', week_next_start_date.toISOString())
    .order('created_at', { ascending: true }) as any;

  const threadResponses: CollectedThreadResponse[] = (dbResponses || []).slice(0, 5).map((resp: any) => {
    let responseText = resp.response_text || '';
    if (responseText.length > 200) {
      responseText = responseText.substring(0, 200) + '... [truncated]';
    }
    return {
      response_text: responseText,
      question: resp.threads?.closing_question || 'Self-Reflection'
    };
  });

  const threadResponsesCompleted = threadResponses.length;

  // 5. Fetch Vocabulary Extractions strictly for this week
  const { data: dbExtractions, error: vocabErr } = await supabase
    .from('vocab_extractions')
    .select('normalized_word, word, confidence, sentence, created_at, entry_id')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId)
    .gte('created_at', week_start_date.toISOString())
    .lt('created_at', week_next_start_date.toISOString());

  const vocabMap = new Map<string, { word: string; freq: number; sentence: string }>();
  (dbExtractions || []).forEach(ext => {
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

  const vocabThisWeek: CollectedVocabWord[] = Array.from(vocabMap.entries()).map(([norm, val]) => ({
    word: val.word,
    normalized_word: norm,
    frequency: val.freq,
    sentence: (val.sentence || '').substring(0, 100)
  })).sort((a, b) => b.frequency - a.frequency).slice(0, 10);

  // 6. Fetch Prior Vocabulary (All-time history prior to this week)
  const { data: dbPriorExtractions } = await supabase
    .from('vocab_extractions')
    .select('normalized_word')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId)
    .lt('created_at', week_start_date.toISOString());

  const priorVocabMap = new Map<string, number>();
  (dbPriorExtractions || []).forEach(ext => {
    const norm = ext.normalized_word.toLowerCase();
    priorVocabMap.set(norm, (priorVocabMap.get(norm) || 0) + 1);
  });

  const newExpressions: string[] = [];
  const growingExpressions: string[] = [];
  const decliningExpressions: string[] = [];

  vocabThisWeek.forEach(item => {
    const norm = item.normalized_word.toLowerCase();
    const priorFreq = priorVocabMap.get(norm) || 0;
    
    if (priorFreq === 0) {
      newExpressions.push(item.word);
    } else if (item.frequency > priorFreq) {
      growingExpressions.push(item.word);
    }
  });

  priorVocabMap.forEach((freq, word) => {
    const norm = word.toLowerCase();
    const thisWeekFreq = vocabMap.get(norm)?.freq || 0;
    if (freq >= 2 && thisWeekFreq === 0) {
      decliningExpressions.push(word);
    }
  });

  const vocabulary_evolution = {
    new_expressions: newExpressions.slice(0, 5),
    growing_expressions: growingExpressions.slice(0, 5),
    declining_expressions: decliningExpressions.slice(0, 5)
  };

  // 7. Graph scores and lengths (exactly 7 positions)
  const scores: { cycle_day: number; ei: number | null; pr: number | null; sa: number | null }[] = [];
  const entry_lengths: number[] = [];
  const rawScores: (number | null)[] = [];
  const eis: (number | null)[] = [];
  const sas: (number | null)[] = [];

  for (let i = 0; i < 7; i++) {
    const targetDateStr = weekDates[i].toISOString().split('T')[0];
    const entry = dateToEntry.get(targetDateStr);

    if (entry && entry.day_ei !== null && entry.day_pr !== null && entry.day_sa !== null) {
      const ei = Number(entry.day_ei);
      const pr = Number(entry.day_pr);
      const sa = Number(entry.day_sa);
      const score = ei + pr + sa;
      const normalized = Math.round((score / 30) * 64);

      entry_lengths.push(normalized);
      rawScores.push(score);
      eis.push(ei);
      sas.push(sa);
      scores.push({
        cycle_day: dayStart + i,
        ei,
        pr,
        sa
      });
    } else {
      entry_lengths.push(0);
      rawScores.push(null);
      eis.push(null);
      sas.push(null);
      scores.push({
        cycle_day: dayStart + i,
        ei: null,
        pr: null,
        sa: null
      });
    }
  }

  // Trend analysis to generate dynamic interpretation
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

  // 8. Fetch Crisis Logs strictly within the calendar week (scoped by user_id and cycle_id)
  const { data: dbCrisisLogs } = await supabase
    .from('crisis_log')
    .select('*')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId)
    .gte('timestamp', week_start_date.toISOString())
    .lt('timestamp', week_next_start_date.toISOString());

  const crisisEvents: CollectedCrisisEvent[] = (dbCrisisLogs || []).map(c => ({
    id: c.id,
    crisis_type: c.crisis_type,
    timestamp: c.timestamp,
    entry_id: c.entry_id
  }));

  // Add any entry-level crisis indicators for entries belonging to this week
  dbEntries.forEach(dbEntry => {
    if (dbEntry && dbEntry.crisis_flag) {
      const exists = crisisEvents.some(ce => ce.timestamp === dbEntry.created_at);
      if (!exists) {
        crisisEvents.push({
          id: dbEntry.id,
          crisis_type: dbEntry.crisis_type || 'Risk_Language',
          timestamp: dbEntry.created_at
        });
      }
    }
  });

  // 9. Fetch Open Threads
  const { data: dbOpenThreads } = await supabase
    .from('open_threads')
    .select('*')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId)
    .order('created_at', { ascending: false })
    .limit(5);

  const openThreads: CollectedOpenThread[] = (dbOpenThreads || []).map(t => ({
    question: t.question,
    status: t.status
  }));

  // 10. Compute Writing Behaviour
  const totalWords = entries.reduce((sum, e) => sum + e.word_count, 0);
  const avg_entry_length = entriesCompleted > 0 ? Math.round(totalWords / entriesCompleted) : 0;

  const writing_times = dbEntries.map(e => {
    const date = new Date(e.written_at || e.created_at);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  const totalReflections = entries.filter(e => e.reflection_question !== null).length;
  const completedReflections = entries.filter(e => e.reflection_answer !== null).length;
  const reflection_completion_rate = totalReflections > 0 ? Number((completedReflections / totalReflections).toFixed(2)) : 1.0;

  const threadsThisWeek = (dbOpenThreads || []).filter(t => {
    const createdDate = new Date(t.created_at);
    return createdDate >= week_start_date && createdDate < week_next_start_date;
  });
  const addressedThreadsThisWeek = threadsThisWeek.filter(t => t.status === 'addressed');
  const thread_completion_rate = threadsThisWeek.length > 0 ? Number((addressedThreadsThisWeek.length / threadsThisWeek.length).toFixed(2)) : 1.0;

  // 11. Populate Audit Log metadata
  const vocabSourcesMap = new Map<string, { entry_id: string; date: string; words: string[] }>();
  dbEntries.forEach(e => {
    vocabSourcesMap.set(e.id, {
      entry_id: e.id,
      date: new Date(e.created_at).toISOString().split('T')[0],
      words: []
    });
  });
  (dbExtractions || []).forEach(ext => {
    const entryId = ext.entry_id;
    if (entryId && vocabSourcesMap.has(entryId)) {
      vocabSourcesMap.get(entryId)!.words.push(ext.word);
    }
  });

  // Extract supporting sentences for audit reproducibility
  const supportingSentences: string[] = [];
  entries.forEach(entry => {
    if (entry.content) {
      const sentences = entry.content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
      supportingSentences.push(...sentences);
    }
  });
  threadResponses.forEach(tr => {
    if (tr.response_text) {
      const sentences = tr.response_text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
      supportingSentences.push(...sentences);
    }
  });

  // Extract reflection IDs
  const reflectionIds: string[] = [];
  dbEntries.forEach(entry => {
    const rawReflection = entry.reflections;
    const reflection = Array.isArray(rawReflection)
      ? (rawReflection[0] || null)
      : (rawReflection || null);
    if (reflection && reflection.id) {
      reflectionIds.push(reflection.id);
    }
  });

  const audit = {
    week_number: weekNumber,
    week_start: week_start_date.toISOString().split('T')[0],
    week_end: week_end_date.toISOString().split('T')[0],
    expected_dates: weekDates.map(d => d.toISOString().split('T')[0]),
    journal_ids_included: dbEntries.map(e => e.id),
    journal_dates_included: dbEntries.map(e => new Date(e.created_at).toISOString().split('T')[0]),
    skipped_dates: missedDates,
    reflection_ids: reflectionIds,
    supporting_crisis_events: crisisEvents.map(ce => ({ id: ce.id, entry_id: ce.entry_id || ce.id })),
    supporting_sentences: supportingSentences,
    score_sources: dbEntries.map(e => ({
      entry_id: e.id,
      date: new Date(e.created_at).toISOString().split('T')[0],
      ei: e.day_ei,
      pr: e.day_pr,
      sa: e.day_sa
    })),
    vocab_sources: Array.from(vocabSourcesMap.values())
  };

  return {
    weekly_stats: {
      entries_completed: entriesCompleted,
      total_possible: totalPossible,
      skipped_days: skippedDays,
      skipped_day_numbers: skippedDayNumbers,
      writing_streak: writingStreak,
      thread_responses_completed: threadResponsesCompleted,
      week_range: weekRange,
      cycle_number: cycleNumber,
      week_number: weekNumber,
      expected_days: 7,
      completed_days: entriesCompleted,
      missed_dates: missedDates,
      perfect_streak: entriesCompleted === 7
    },
    entries,
    threadResponses,
    vocabThisWeek,
    vocabulary_evolution,
    scores,
    crisisEvents,
    openThreads,
    writing_behaviour: {
      avg_entry_length,
      entry_lengths,
      writing_times,
      reflection_completion_rate,
      thread_completion_rate,
      skipped_days: skippedDayNumbers,
      consistency
    },
    personalityContext,
    audit
  };
}
