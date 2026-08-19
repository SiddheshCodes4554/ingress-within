import { getAIProvider } from './ai/factory';
import { supabase } from './db';

export interface CrisisDetectionResult {
  crisisFlag: boolean;
  crisisType: 'Risk_Language' | 'Immediate' | 'Combined' | null;
  explanation: string;
  triggeredLayers: string[];
  riskQuote?: string | null;
}

const CRISIS_KEYWORDS = [
  /\bend\s+my\s+life\b/i,
  /\bending\s+my\s+life\b/i,
  /\bkill\s+myself\b/i,
  /\bkilling\s+myself\b/i,
  /\bharm\s+myself\b/i,
  /\bharming\s+myself\b/i,
  /\bsuicide\b/i,
  /\bend\s+it\s+all\b/i,
  /\bdon't\s+want\s+to\s+live\b/i,
  /\bdo\s+not\s+want\s+to\s+live\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bcommit\s+suicide\b/i,
  /\btake\s+my\s+own\s+life\b/i,
  /\bbetter\s+off\s+dead\b/i,
  /\bslash\s+my\s+wrists\b/i,
  /\bcut\s+my\s+wrists\b/i,
  /\bswallow\s+pills\b/i,
  /\bhang\s+myself\b/i,
];

/**
 * Evaluates the 4 layered crisis detection protocol.
 * If any layer triggers, the final crisisFlag is set to true.
 * Uses AIProvider abstraction (Claude Primary + Groq Fallback) for Layer 2.
 */
export async function evaluateCrisisLayers(
  text: string | null,
  providerName: string = process.env.AI_PROVIDER || 'claude',
  aiScores?: {
    day_ei: number | null;
    day_sa: number | null;
    riskLanguageDetected?: boolean;
    riskLanguageQuote?: string | null;
  } | null,
  entryId?: string | null
): Promise<CrisisDetectionResult> {
  const content = (text || '').trim();
  const triggeredLayers: string[] = [];
  let crisisFlag = false;
  let crisisType: 'Risk_Language' | 'Immediate' | 'Combined' | null = null;
  let riskQuote: string | null = null;
  let explanations: string[] = [];
  let aiCheckError: Error | null = null;

  if (!content) {
    return {
      crisisFlag: false,
      crisisType: null,
      explanation: 'Empty content. No crisis checks triggered.',
      triggeredLayers: [],
      riskQuote: null
    };
  }

  // ==========================================
  // LAYER 1: Explicit Risk Language Keywords (Static / Deterministic Check)
  // ==========================================
  let keywordMatch: string | null = null;
  for (const regex of CRISIS_KEYWORDS) {
    const match = content.match(regex);
    if (match) {
      keywordMatch = match[0];
      break;
    }
  }

  if (keywordMatch) {
    crisisFlag = true;
    crisisType = 'Risk_Language';
    triggeredLayers.push('Layer 1 (Keyword Match)');
    riskQuote = keywordMatch;
    explanations.push(`Layer 1 Triggered: Found explicit risk keyword/phrase matching "${keywordMatch}".`);
  }

  // ==========================================
  // LAYER 2: Semantic Risk Classification (AI Provider: Claude Primary + Groq Fallback)
  // ==========================================
  const startTime = Date.now();
  let aiProviderInstance: any = null;

  try {
    aiProviderInstance = getAIProvider(providerName);
    const aiResult = await aiProviderInstance.detectCrisis(content);
    const latency = Date.now() - startTime;
    
    if (aiResult && typeof aiResult.isCrisis === 'boolean') {
      if (aiResult.isCrisis) {
        crisisFlag = true;
        if (!crisisType) crisisType = 'Risk_Language';
        triggeredLayers.push('Layer 2 (Semantic AI Check)');
        if (!riskQuote) riskQuote = aiResult.reason || 'AI semantic crisis trigger';
        explanations.push(`Layer 2 Triggered: AI classification flagged crisis (Reason: "${aiResult.reason || 'No reason provided'}").`);
      }

      // Record Observability
      if (entryId) {
        try {
          const actualProvider = aiProviderInstance?.lastProviderUsed || providerName;
          const fallbackUsed = aiProviderInstance?.lastFallbackUsed || false;
          const primaryProvider = aiProviderInstance?.lastPrimaryProvider || 'claude';
          const rawResponse = aiProviderInstance?.lastRawResponse || JSON.stringify(aiResult);

          await supabase.from('ai_observability').insert({
            entry_id: entryId,
            provider: actualProvider,
            raw_provider_response: rawResponse,
            parsed_response: {
              ...aiResult,
              _metadata: {
                fallback_used: fallbackUsed,
                primary_provider: primaryProvider
              }
            },
            validation_result: {
              status: 'passed',
              isCrisis: aiResult.isCrisis,
              fallback_used: fallbackUsed,
              primary_provider: primaryProvider
            },
            processing_time: latency,
            retry_count: fallbackUsed ? 1 : 0,
            error_reason: null
          });
        } catch (obsErr) {
          console.warn('[Crisis Hardening] Failed to write to ai_observability:', obsErr);
        }
      }
    } else {
      throw new Error('AI Provider returned invalid schema for detectCrisis (missing isCrisis boolean).');
    }
  } catch (err: any) {
    aiCheckError = err;
    console.error('[Crisis Hardening] Layer 2 semantic check failed across both providers:', err.message || err);
    explanations.push(`Layer 2 Error: AI check failed (${err.message || 'unknown'}).`);

    if (entryId) {
      try {
        await supabase.from('ai_failures').insert({
          entry_id: entryId,
          prompt: `Crisis Detection for content: "${content.substring(0, 300)}..."`,
          raw_response: aiProviderInstance?.lastRawResponse || null,
          parsing_error: err.message || 'Crisis detection failed across all providers',
          timestamp: new Date().toISOString()
        });
      } catch (failLogErr) {
        console.warn('[Crisis Hardening] Failed to write to ai_failures:', failLogErr);
      }
    }
  }

  // ==========================================
  // LAYER 3: Score-based Trigger (EI >= 9.0 AND SA <= 2.0)
  // ==========================================
  if (aiScores) {
    const { day_ei, day_sa } = aiScores;
    if (day_ei !== null && day_sa !== null && day_ei >= 9.0 && day_sa <= 2.0) {
      crisisFlag = true;
      // Immediate distress is prioritised as 'Immediate' type
      crisisType = 'Immediate';
      triggeredLayers.push('Layer 3 (Score Threshold)');
      explanations.push(`Layer 3 Triggered: High distress threshold reached (EI = ${day_ei} >= 9.0 and SA = ${day_sa} <= 2.0).`);
    }
  }

  // ==========================================
  // LAYER 4: Combined Confidence Logic (Scoring response risk flag)
  // ==========================================
  if (aiScores && aiScores.riskLanguageDetected) {
    crisisFlag = true;
    if (!crisisType) crisisType = 'Risk_Language';
    triggeredLayers.push('Layer 4 (Combined Logic)');
    if (!riskQuote) riskQuote = aiScores.riskLanguageQuote || 'Scoring model risk flag';
    explanations.push(`Layer 4 Triggered: Scoring model flagged risk language (Quote: "${aiScores.riskLanguageQuote || 'None'}").`);
  }

  // SAFETY FAIL-CLOSED RULE:
  // If NO deterministic layers triggered AND the AI check threw an error across both providers,
  // we do NOT silently declare the entry as safe ("isCrisis = false"). We throw the error so
  // the caller/worker fails closed, does not mark crisis_checked = true, and retries.
  if (!crisisFlag && aiCheckError) {
    throw new Error(`[Crisis Detection Hardening] AI check failed across providers and no deterministic crisis layers triggered. Failing closed: ${aiCheckError.message}`);
  }

  // Final coordination of explanation
  let finalExplanation = '';
  if (crisisFlag) {
    finalExplanation = explanations.join(' | ');
  } else {
    finalExplanation = 'No crisis triggers matched across all 4 evaluation layers.';
  }

  return {
    crisisFlag,
    crisisType,
    explanation: finalExplanation,
    triggeredLayers,
    riskQuote
  };
}
