import { getAIProvider } from './factory';
import { validateLlmScoringResponse, LlmScoringResponse } from './validation';
import { supabase } from '../db';

export interface PipelineExecutionResult {
  success: boolean;
  scoreResult: LlmScoringResponse | null;
  rawResponse: string;
  errorReason: string | null;
  retryCount: number;
  latency: number;
}

/**
 * Hardened execution wrapper for the Ingress Within AI scoring pipeline.
 * Implements a retry policy, Zod schema validation, self-healing JSON parsing (via extractJson),
 * and logging of all results to ai_failures and ai_observability tables.
 */
export async function executeScoringPipeline(
  reflectionText: string | null,
  newEntryText: string | null,
  personalityContext: string | null,
  providerName: string,
  entryId: string | null = null
): Promise<PipelineExecutionResult> {
  const provider = getAIProvider(providerName);
  const startTime = Date.now();
  
  let retryCount = 0;
  let rawResponse = '';
  let errorReason: string | null = null;
  let parsedJson: any = null;
  let scoreResult: LlmScoringResponse | null = null;
  let success = false;

  const runScoringCall = async () => {
    return await provider.scoreEntryDimensions(reflectionText, newEntryText, personalityContext);
  };

  // Attempt 1
  try {
    const res = await runScoringCall();
    rawResponse = (provider as any).lastRawResponse || JSON.stringify(res);
    parsedJson = res;
    scoreResult = validateLlmScoringResponse(parsedJson);
    success = true;
  } catch (err: any) {
    errorReason = err.message || String(err);
    retryCount++;
    console.warn(`[AI Hardening Pipeline] First attempt failed. Error: ${errorReason}. Retrying once...`);
    
    // Attempt 2 (Structured Re-run / Retry)
    try {
      const res = await runScoringCall();
      rawResponse = (provider as any).lastRawResponse || JSON.stringify(res);
      parsedJson = res;
      scoreResult = validateLlmScoringResponse(parsedJson);
      success = true;
      errorReason = null; // Clear error on success
    } catch (retryErr: any) {
      errorReason = retryErr.message || String(retryErr);
      rawResponse = (provider as any).lastRawResponse || rawResponse;
      console.error(`[AI Hardening Pipeline] Retry attempt failed. Error: ${errorReason}`);
    }
  }

  const latency = Date.now() - startTime;

  // Persist Observability & Failures logs
  try {
    if (entryId) {
      const actualProvider = (provider as any).lastProviderUsed || providerName;
      const fallbackUsed = (provider as any).lastFallbackUsed || false;
      const primaryProvider = (provider as any).lastPrimaryProvider || providerName;
      const usage = (provider as any).lastUsage || null;

      // 1. Log to ai_observability table
      const { error: obsError } = await supabase
        .from('ai_observability')
        .insert({
          entry_id: entryId,
          provider: actualProvider,
          raw_provider_response: rawResponse || null,
          parsed_response: parsedJson ? {
            ...parsedJson,
            _metadata: {
              fallback_used: fallbackUsed,
              primary_provider: primaryProvider,
              usage
            }
          } : null,
          validation_result: success ? { 
            status: 'passed',
            fallback_used: fallbackUsed,
            primary_provider: primaryProvider
          } : { 
            status: 'failed', 
            error: errorReason,
            fallback_used: fallbackUsed,
            primary_provider: primaryProvider
          },
          processing_time: latency,
          retry_count: retryCount,
          error_reason: errorReason || null
        });
      
      if (obsError) {
        console.error('[AI Hardening Pipeline] Failed to write to ai_observability:', obsError.message);
      }

      // 2. Log to ai_failures table if failed
      if (!success) {
        const systemPrompt = (provider as any).lastSystemPrompt || 'scoreEntryDimensions';
        const userContent = (provider as any).lastUserContent || '';
        const promptDesc = `System Prompt:\n${systemPrompt}\n\nUser Content:\n${userContent}`;
        
        const { error: failError } = await supabase
          .from('ai_failures')
          .insert({
            entry_id: entryId,
            prompt: promptDesc,
            raw_response: rawResponse || null,
            parsing_error: errorReason || 'Unknown validation/parsing failure',
            timestamp: new Date().toISOString()
          });

        if (failError) {
          console.error('[AI Hardening Pipeline] Failed to write to ai_failures:', failError.message);
        }
      }
    }
  } catch (logErr) {
    console.error('[AI Hardening Pipeline] Observability logging caught unhandled error:', logErr);
  }

  return {
    success,
    scoreResult,
    rawResponse,
    errorReason,
    retryCount,
    latency
  };
}
