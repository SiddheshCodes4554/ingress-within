export interface ClarityScoreResponse {
  clarityScore: number;
  sentiment: string;
  stressIndicators: string[];
}

export interface ReflectionResponse {
  reflection: string;
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
  generateReflection(entryContent: string, context?: string): Promise<ReflectionResponse>;
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
  extractVocabulary(entryContent: string): Promise<{ words: { word: string; normalized_word: string }[] }>;
  extractConcepts(entryContent: string): Promise<{ concepts: { concept: string; confidence: number }[] }>;
  groupClusters(words: { word: string; normalized_word: string; frequency: number }[]): Promise<{ clusters: { cluster_name: string; cluster_type: string; words: string[] }[] }>;
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
