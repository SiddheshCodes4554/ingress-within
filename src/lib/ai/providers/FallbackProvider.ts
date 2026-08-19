import { 
  AIProvider, 
  ClarityScoreResponse, 
  ReflectionResponse, 
  WeeklySummaryResponse, 
  MonthlyReportResponse, 
  OceanSummaryResponse, 
  ExerciseInsightResponse,
  CrisisDetectionResponse,
  EntryDimensionsScoreResponse,
  WeeklyReportInput,
  WeeklyReportResponse
} from '../types';
import { ClaudeProvider } from './claude';
import { GroqProvider } from './GroqProvider';

export class FallbackProvider implements AIProvider {
  public primary: AIProvider;
  public fallback: AIProvider;

  public lastProviderUsed: 'claude' | 'groq' = 'claude';
  public lastFallbackUsed: boolean = false;
  public lastPrimaryProvider: string = 'claude';
  public lastPrimaryError: string | null = null;
  public lastLatencyMs: number = 0;

  public lastSystemPrompt: string = '';
  public lastUserContent: string = '';
  public lastRawResponse: string = '';
  public lastUsage: any = null;

  constructor(primary?: AIProvider, fallback?: AIProvider) {
    this.primary = primary || new ClaudeProvider();
    this.fallback = fallback || new GroqProvider();
  }

  private syncTracing(provider: AIProvider) {
    const p = provider as any;
    this.lastSystemPrompt = p.lastSystemPrompt || '';
    this.lastUserContent = p.lastUserContent || '';
    this.lastRawResponse = p.lastRawResponse || '';
    this.lastUsage = p.lastUsage || null;
  }

  private async executeWithFallback<T>(
    operationName: string,
    operation: (provider: AIProvider) => Promise<T>,
    validate?: (result: T) => boolean
  ): Promise<T> {
    const startTime = Date.now();
    this.lastFallbackUsed = false;
    this.lastPrimaryError = null;

    // 1. Attempt Primary Provider (Claude)
    try {
      const result = await operation(this.primary);
      
      // Structured output validation
      if (result === undefined || result === null) {
        throw new Error(`Primary provider (Claude) returned null/undefined for "${operationName}".`);
      }
      if (validate && !validate(result)) {
        throw new Error(`Primary provider (Claude) returned invalid or incomplete schema structure for "${operationName}".`);
      }

      this.lastProviderUsed = 'claude';
      this.lastFallbackUsed = false;
      this.lastLatencyMs = Date.now() - startTime;
      this.syncTracing(this.primary);
      return result;
    } catch (primaryErr: any) {
      const errorMsg = primaryErr?.message || String(primaryErr);
      this.lastPrimaryError = errorMsg;
      console.warn(`[AI Fallback Layer] Primary provider (Claude) failed on "${operationName}": ${errorMsg}. Triggering Groq fallback...`);

      // 2. Attempt Fallback Provider (Groq)
      try {
        const fallbackResult = await operation(this.fallback);

        if (fallbackResult === undefined || fallbackResult === null) {
          throw new Error(`Fallback provider (Groq) returned null/undefined for "${operationName}".`);
        }
        if (validate && !validate(fallbackResult)) {
          throw new Error(`Fallback provider (Groq) returned invalid or incomplete schema structure for "${operationName}".`);
        }

        this.lastProviderUsed = 'groq';
        this.lastFallbackUsed = true;
        this.lastLatencyMs = Date.now() - startTime;
        this.syncTracing(this.fallback);
        console.log(`[AI Fallback Layer] Groq fallback succeeded for "${operationName}".`);
        return fallbackResult;
      } catch (fallbackErr: any) {
        const fbErrorMsg = fallbackErr?.message || String(fallbackErr);
        console.error(`[AI Fallback Layer] Both Claude and Groq failed on "${operationName}". Primary error: ${errorMsg} | Fallback error: ${fbErrorMsg}`);
        throw new Error(`AI processing failed: Primary provider (Claude) failed (${errorMsg}) and Fallback provider (Groq) also failed (${fbErrorMsg}).`);
      }
    }
  }

  async scoreEntry(content: string): Promise<ClarityScoreResponse> {
    return this.executeWithFallback(
      'scoreEntry',
      p => p.scoreEntry(content),
      res => Boolean(res && typeof res.clarityScore === 'number' && !isNaN(res.clarityScore) && typeof res.sentiment === 'string')
    );
  }

  async generateReflection(
    entryContent: string,
    context?: string,
    latestThread?: string,
    previousReflection?: string,
    useSimplifiedPrompt?: boolean
  ): Promise<ReflectionResponse> {
    return this.executeWithFallback(
      'generateReflection',
      p => p.generateReflection(entryContent, context, latestThread, previousReflection, useSimplifiedPrompt),
      res => Boolean(res && typeof res.reflection === 'string' && res.reflection.trim().length > 0 && typeof res.closing_question === 'string')
    );
  }

  async generateWeeklySummary(
    entries: { content: string; created_at: string }[],
    personalitySummary?: string
  ): Promise<WeeklySummaryResponse> {
    return this.executeWithFallback(
      'generateWeeklySummary',
      p => p.generateWeeklySummary(entries, personalitySummary),
      res => Boolean(res && typeof res.title === 'string' && typeof res.body === 'string' && Array.isArray(res.emos))
    );
  }

  async generateWeeklyReport(data: WeeklyReportInput): Promise<WeeklyReportResponse> {
    return this.executeWithFallback(
      'generateWeeklyReport',
      p => p.generateWeeklyReport(data),
      res => Boolean(res && typeof res.week_tone === 'string' && typeof res.what_we_saw === 'string')
    );
  }

  async generateMonthlyReport(entries: { content: string; created_at: string }[]): Promise<MonthlyReportResponse> {
    return this.executeWithFallback(
      'generateMonthlyReport',
      p => p.generateMonthlyReport(entries),
      res => Boolean(res && Array.isArray(res.dimensions) && typeof res.insight === 'string')
    );
  }

  async generateOceanSummary(entries: { content: string; created_at: string }[]): Promise<OceanSummaryResponse> {
    return this.executeWithFallback(
      'generateOceanSummary',
      p => p.generateOceanSummary(entries),
      res => Boolean(
        res &&
        typeof res.openness === 'number' &&
        typeof res.conscientiousness === 'number' &&
        typeof res.extraversion === 'number' &&
        typeof res.agreeableness === 'number' &&
        typeof res.neuroticism === 'number' &&
        typeof res.analysis === 'string'
      )
    );
  }

  async generatePersonalitySummary(scores: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  }): Promise<string> {
    return this.executeWithFallback(
      'generatePersonalitySummary',
      p => p.generatePersonalitySummary(scores),
      res => Boolean(typeof res === 'string' && res.trim().length > 0)
    );
  }

  async generateExerciseInsight(
    stressorType: string,
    reactiveThought: string,
    reframedThought: string
  ): Promise<ExerciseInsightResponse> {
    return this.executeWithFallback(
      'generateExerciseInsight',
      p => p.generateExerciseInsight(stressorType, reactiveThought, reframedThought),
      res => Boolean(res && typeof res.insight === 'string' && Array.isArray(res.recommendations))
    );
  }

  async detectCrisis(content: string): Promise<CrisisDetectionResponse> {
    return this.executeWithFallback(
      'detectCrisis',
      p => p.detectCrisis(content),
      res => Boolean(res && typeof res.isCrisis === 'boolean')
    );
  }

  async scoreEntryDimensions(
    reflectionText?: string | null,
    newEntryText?: string | null,
    personalityContext?: string | null
  ): Promise<EntryDimensionsScoreResponse> {
    return this.executeWithFallback(
      'scoreEntryDimensions',
      p => p.scoreEntryDimensions(reflectionText, newEntryText, personalityContext),
      res => Boolean(res && (res.reflection !== undefined || res.newEntry !== undefined))
    );
  }

  async extractVocabulary(entryContent: string): Promise<{
    expressions: {
      word: string;
      normalized: string;
      semantic_meaning: string;
      context: string;
      confidence: number;
    }[];
  }> {
    return this.executeWithFallback(
      'extractVocabulary',
      p => p.extractVocabulary(entryContent),
      res => Boolean(res && Array.isArray(res.expressions))
    );
  }

  async extractConcepts(entryContent: string): Promise<{ concepts: { concept: string; confidence: number }[] }> {
    return this.executeWithFallback(
      'extractConcepts',
      p => p.extractConcepts(entryContent),
      res => Boolean(res && Array.isArray(res.concepts))
    );
  }

  async groupClusters(
    words: { word: string; normalized_word: string; frequency: number; semantic_meaning?: string }[]
  ): Promise<{
    clusters: {
      cluster_name: string;
      description: string;
      confidence: number;
      words: string[];
    }[];
  }> {
    return this.executeWithFallback(
      'groupClusters',
      p => p.groupClusters(words),
      res => Boolean(res && Array.isArray(res.clusters))
    );
  }

  async scoreEmotionalRelevance(
    words: string[],
    entryContent: string
  ): Promise<{ validatedWords: { word: string; is_emotional: boolean; category?: 'emotional' | 'theme' | 'general'; score: number }[] }> {
    return this.executeWithFallback(
      'scoreEmotionalRelevance',
      p => p.scoreEmotionalRelevance(words, entryContent),
      res => Boolean(res && Array.isArray(res.validatedWords))
    );
  }

  async callRaw(prompt: string): Promise<string> {
    return this.executeWithFallback(
      'callRaw',
      p => p.callRaw(prompt),
      res => Boolean(typeof res === 'string' && res.length > 0)
    );
  }
}
