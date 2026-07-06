export interface ClarityScoreResponse {
  clarityScore: number;
  sentiment: string;
  stressIndicators: string[];
}

export interface ReflectionResponse {
  reflection: string;
  closing_nudge?: string;
  closing_question: string;
  classification: 'Flat' | 'Open' | 'Scattered';
  confidence: 'high' | 'medium' | 'low';
  themes: string[];
  vocabulary?: string[];
  processing_notes: string;
  rawPrompt?: string;
  rawResponse?: string;
}

export interface WeeklyEmotion {
  w: string;      // Emotion word (e.g. "fine")
  c: string;      // Occurrence count/string (e.g. "×6")
  r: string[];    // Synonyms / related raw expressions (e.g. ["managing", "numb"])
}

export interface WeeklySummaryResponse {
  title: string;
  body: string;
  why: string;
  emos: WeeklyEmotion[];
  q: string;
}

export interface MonthlyDimension {
  label: string;  // e.g. "Emotional intensity"
  fill: string;   // e.g. "72%"
  val: string;    // e.g. "High" or "Low"
  desc: string;   // Description summary
  color: string;  // Visual representation color bg class
}

export interface MonthlyReportResponse {
  dimensions: MonthlyDimension[];
  insight: string;
}

export interface OceanSummaryResponse {
  openness: number;            // 0 - 100
  conscientiousness: number;   // 0 - 100
  extraversion: number;        // 0 - 100
  agreeableness: number;       // 0 - 100
  neuroticism: number;         // 0 - 100
  analysis: string;            // Text analysis
}

export interface ExerciseInsightResponse {
  insight: string;
  recommendations: string[];
}

export interface CrisisDetectionResponse {
  isCrisis: boolean;
  reason?: string;
}

export interface AIProvider {
  scoreEntry(content: string): Promise<ClarityScoreResponse>;
  generateReflection(
    entryContent: string,
    context?: string,
    latestThread?: string,
    previousReflection?: string,
    useSimplifiedPrompt?: boolean
  ): Promise<ReflectionResponse>;
  generateWeeklySummary(entries: { content: string; created_at: string }[], personalitySummary?: string): Promise<WeeklySummaryResponse>;
  generateMonthlyReport(entries: { content: string; created_at: string }[]): Promise<MonthlyReportResponse>;
  generateOceanSummary(entries: { content: string; created_at: string }[]): Promise<OceanSummaryResponse>;
  generatePersonalitySummary(scores: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  }): Promise<string>;
  generateExerciseInsight(
    stressorType: string,
    reactiveThought: string,
    reframedThought: string
  ): Promise<ExerciseInsightResponse>;
  detectCrisis(content: string): Promise<CrisisDetectionResponse>;
  scoreEntryDimensions(
    reflectionText?: string | null,
    newEntryText?: string | null,
    personalityContext?: string | null
  ): Promise<EntryDimensionsScoreResponse>;
  extractVocabulary(entryContent: string): Promise<{
    expressions: {
      word: string;
      normalized: string;
      semantic_meaning: string;
      context: string;
      confidence: number;
    }[];
  }>;
  extractConcepts(entryContent: string): Promise<{ concepts: { concept: string; confidence: number }[] }>;
  groupClusters(
    words: { word: string; normalized_word: string; frequency: number; semantic_meaning?: string }[]
  ): Promise<{
    clusters: {
      cluster_name: string;
      description: string;
      confidence: number;
      words: string[];
    }[];
  }>;
  scoreEmotionalRelevance(words: string[], entryContent: string): Promise<{ validatedWords: { word: string; is_emotional: boolean; category?: 'emotional' | 'theme' | 'general'; score: number }[] }>;
  generateWeeklyReport(data: WeeklyReportInput): Promise<WeeklyReportResponse>;
  callRaw(prompt: string): Promise<string>;
}

export interface WeeklyReportInput {
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
  entries: {
    id: string;
    cycle_day: number;
    content: string;
    word_count: number;
    created_at: string;
    written_at: string;
    reflection_question: string | null;
    reflection_answer: string | null;
  }[];
  threadResponses: {
    id: string;
    response_text: string;
    created_at: string;
    question: string;
  }[];
  vocabThisWeek: {
    word: string;
    normalized_word: string;
    frequency: number;
    sentence: string;
  }[];
  vocabulary_evolution: {
    new_expressions: string[];
    growing_expressions: string[];
    declining_expressions: string[];
  };
  scores: {
    cycle_day: number;
    ei: number | null;
    pr: number | null;
    sa: number | null;
  }[];
  crisisEvents: {
    id: string;
    crisis_type: string;
    timestamp: string;
  }[];
  openThreads: {
    id: string;
    question: string;
    status: string;
    created_at: string;
    addressed_at: string | null;
  }[];
  writing_behaviour: {
    avg_entry_length: number;
    entry_lengths: number[];
    writing_times: string[];
    reflection_completion_rate: number;
    thread_completion_rate: number;
    skipped_days: number[];
  };
  personalityContext: string | null;
  lastWeekTopExpressions?: string[] | null;
}

export interface ScoreDimensionDetail {
  avg: number;
  highest: {
    day: number;
    score: number;
  };
  lowest: {
    day: number;
    score: number;
  };
  interpretation: string;
}

export interface WeeklyReportResponse {
  week_tone: string;
  since_last_week: {
    last_week_words: string[];
    this_week_words: string[];
  } | string;
  what_we_saw: string;
  candidate_quote: string;
  carry_question: string;
  analytical_block: {
    emotional_tone: string;
    agency_language: string;
    primary_theme: string;
    trajectory: string;
    notable_absence: string;
  };
  /** Top 3 emotion words the user actually wrote, each paired with 2–3 semantically related words they did NOT write */
  emotion_clusters: {
    word: string;       // exact word/phrase from the user's writing
    related: string[];  // 2–3 semantically adjacent words the user didn't use
  }[];
}

export interface DimensionScores {
  ei: number;
  pr: number;
  sa: number;
}

export interface EntryDimensionsScoreResponse {
  reflection: DimensionScores | null;
  newEntry: DimensionScores | null;
  confidenceFlag: boolean;
  confidenceReason: string;
  riskLanguageDetected?: boolean;
  riskLanguageQuote?: string | null;
  arcScoringApplied?: boolean;
}
