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
  };
  personalityContext: string | null;
}

/**
 * Collects all real user data for a specific cycle and week range.
 * This runs completely server-side and draws from the entire database history.
 */
export async function collectWeeklyReportData(input: WeeklyReportCollectorInput): Promise<WeeklyReportData> {
  const { userId, cycleId, weekNumber, dayStart, dayEnd } = input;

  // 1. Fetch Cycle Information
  const { data: cycle, error: cycleErr } = await supabase
    .from('cycles')
    .select('*')
    .eq('id', cycleId)
    .single();

  if (cycleErr || !cycle) {
    throw new Error(`Failed to fetch cycle details for ID ${cycleId}: ${cycleErr?.message}`);
  }

  const cycleNumber = cycle.cycle_number !== undefined ? cycle.cycle_number : (cycle.number || 1);
  const cycleStartDate = new Date(cycle.start_date || cycle.started_at || cycle.created_at);

  // Calculate calendar date range for the week
  const calendarStartDate = new Date(cycleStartDate.getTime() + (dayStart - 1) * 24 * 60 * 60 * 1000);
  const calendarEndDate = new Date(cycleStartDate.getTime() + dayEnd * 24 * 60 * 60 * 1000); // Up to end of dayEnd

  const weekRange = `${calendarStartDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(calendarEndDate.getTime() - 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;

  // 2. Fetch User Personality Context
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('personality_summary_text')
    .eq('id', userId)
    .single();

  let personalityContext = user?.personality_summary_text || null;
  if (personalityContext && personalityContext.length > 1200) {
    personalityContext = personalityContext.substring(0, 1200) + '... [truncated for token limit]';
  }

  // 3. Fetch Weekly Entries (joining reflections)
  const { data: dbEntries, error: entriesErr } = await supabase
    .from('entries')
    .select('*, reflections(*)')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId)
    .gte('cycle_day', dayStart)
    .lte('cycle_day', dayEnd)
    .order('cycle_day', { ascending: true });

  if (entriesErr) {
    throw new Error(`Failed to fetch weekly entries: ${entriesErr.message}`);
  }

  const entries: CollectedEntry[] = (dbEntries || []).map(entry => {
    // Decrypt content
    let text = decrypt(entry.new_entry_text_encrypted, entry.new_entry_text_iv) || entry.content || '';
    
    // Truncate entry content to prevent API rate limits (6,000 TPM limit on free tier)
    if (text.length > 400) {
      text = text.substring(0, 400) + '... [truncated for token limit]';
    }
    
    // Parse reflection if present
    const rawReflection = entry.reflections;
    const reflection = Array.isArray(rawReflection)
      ? (rawReflection[0] || null)
      : (rawReflection || null);

    return {
      cycle_day: entry.cycle_day,
      content: text,
      word_count: entry.word_count || text.split(/\s+/).filter(Boolean).length || 0,
      day_ei: entry.day_ei !== null ? Number(entry.day_ei) : null,
      day_pr: entry.day_pr !== null ? Number(entry.day_pr) : null,
      day_sa: entry.day_sa !== null ? Number(entry.day_sa) : null,
      reflection_question: reflection?.closing_question || null,
      reflection_answer: (reflection?.status === 'completed' && reflection?.reflection_answer) ? reflection.reflection_answer : null
    };
  });

  // Calculate stats from entries
  const entriesCompleted = entries.filter(e => e.content.trim().length > 0).length;
  const totalPossible = (dayEnd - dayStart) + 1;
  const skippedDayNumbers: number[] = [];
  const entriesDays = new Set(entries.map(e => e.cycle_day));
  for (let d = dayStart; d <= dayEnd; d++) {
    if (!entriesDays.has(d)) {
      skippedDayNumbers.push(d);
    }
  }
  const skippedDays = skippedDayNumbers.length;

  // Calculate Streak (all time or active cycle up to dayEnd)
  // Let's count consecutive days written in this cycle up to dayEnd
  const { data: allCycleEntries } = await supabase
    .from('entries')
    .select('cycle_day')
    .eq('cycle_id', cycleId)
    .lte('cycle_day', dayEnd)
    .order('cycle_day', { ascending: false });
  
  let writingStreak = 0;
  const cycleDaysWritten = new Set((allCycleEntries || []).map(e => e.cycle_day));
  
  // Starting from dayEnd (or the maximum day written), count backwards
  let currentStreakDay = Math.min(dayEnd, Math.max(...Array.from(cycleDaysWritten), 1));
  while (currentStreakDay >= 1 && cycleDaysWritten.has(currentStreakDay)) {
    writingStreak++;
    currentStreakDay--;
  }

  // 4. Fetch Thread Responses written this week
  const { data: dbResponses, error: responsesErr } = await supabase
    .from('thread_responses')
    .select('*, threads(closing_question)')
    .eq('user_id', userId)
    .gte('created_at', calendarStartDate.toISOString())
    .lte('created_at', calendarEndDate.toISOString())
    .order('created_at', { ascending: true }) as any;

  const threadResponses: CollectedThreadResponse[] = (dbResponses || []).map((resp: any) => {
    let responseText = resp.response_text || '';
    if (responseText.length > 500) {
      responseText = responseText.substring(0, 500) + '... [truncated]';
    }
    return {
      response_text: responseText,
      question: resp.threads?.closing_question || 'Self-Reflection'
    };
  });

  const threadResponsesCompleted = threadResponses.length;

  // 5. Fetch Vocabulary Extractions for this week
  const { data: dbExtractions, error: vocabErr } = await supabase
    .from('vocab_extractions')
    .select('normalized_word, word, confidence, sentence, created_at')
    .eq('user_id', userId)
    .eq('cycle_id', cycleId)
    .gte('created_at', calendarStartDate.toISOString())
    .lte('created_at', calendarEndDate.toISOString());

  // Group by normalized_word
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
    .lt('created_at', calendarStartDate.toISOString());

  const priorVocabMap = new Map<string, number>();
  (dbPriorExtractions || []).forEach(ext => {
    const norm = ext.normalized_word.toLowerCase();
    priorVocabMap.set(norm, (priorVocabMap.get(norm) || 0) + 1);
  });

  // Pre-calculate vocabulary evolution deterministically (reduces TPM token usage by ~5,000 tokens)
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

  // 7. Fetch daily scores
  const scores = entries.map(e => ({
    cycle_day: e.cycle_day,
    ei: e.day_ei,
    pr: e.day_pr,
    sa: e.day_sa
  }));

  // 8. Fetch Crisis Logs
  const { data: dbCrisisLogs } = await supabase
    .from('crisis_log')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', calendarStartDate.toISOString())
    .lte('timestamp', calendarEndDate.toISOString());

  const crisisEvents: CollectedCrisisEvent[] = (dbCrisisLogs || []).map(c => ({
    id: c.id,
    crisis_type: c.crisis_type,
    timestamp: c.timestamp
  }));

  // Add any entry-level crisis indicators
  entries.forEach(e => {
    const dbEntry = dbEntries?.find(de => de.cycle_day === e.cycle_day);
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
    .eq('cycle_id', cycleId);

  const openThreads: CollectedOpenThread[] = (dbOpenThreads || []).map(t => ({
    question: t.question,
    status: t.status
  }));

  // 10. Compute Writing Behaviour
  const totalWords = entries.reduce((sum, e) => sum + e.word_count, 0);
  const avg_entry_length = entriesCompleted > 0 ? Math.round(totalWords / entriesCompleted) : 0;
  const entry_lengths = entries.map(e => e.word_count);

  const writing_times = (dbEntries || [])
    .map(e => {
      const date = new Date(e.written_at || e.created_at);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    });

  const totalReflections = entries.filter(e => e.reflection_question !== null).length;
  const completedReflections = entries.filter(e => e.reflection_answer !== null).length;
  const reflection_completion_rate = totalReflections > 0 ? Number((completedReflections / totalReflections).toFixed(2)) : 1.0;

  // Thread completion rate: addressed threads divided by total active threads in this week's context
  const threadsThisWeek = (dbOpenThreads || []).filter(t => {
    const createdDate = new Date(t.created_at);
    return createdDate >= calendarStartDate && createdDate <= calendarEndDate;
  });
  const addressedThreadsThisWeek = threadsThisWeek.filter(t => t.status === 'addressed');
  const thread_completion_rate = threadsThisWeek.length > 0 ? Number((addressedThreadsThisWeek.length / threadsThisWeek.length).toFixed(2)) : 1.0;

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
      week_number: weekNumber
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
      skipped_days: skippedDayNumbers
    },
    personalityContext
  };
}
