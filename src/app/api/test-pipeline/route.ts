import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';
import { getAIProvider } from '../../../lib/ai/factory';
import { queueRegistry } from '../../../lib/queue/registry';
import { getAuthenticatedUser } from '../../../lib/auth-helper';
import { processEntryScoring } from '../../../lib/queue/workers/entryScoringWorker';
import { processCrisisDetection } from '../../../lib/queue/workers/crisisDetectionWorker';
import { processReflectionGeneration, validateReflection } from '../../../lib/queue/workers/reflectionWorker';
import { connection } from '../../../lib/queue/config';
import { executeScoringPipeline } from '../../../lib/ai/pipeline';
import { evaluateCrisisLayers } from '../../../lib/crisis-detector';
import { decrypt } from '../../../lib/encryption';
import { extractVocabularyDeterministic } from '../../../lib/vocabEngine';



export async function POST(request: NextRequest) {
  // 1. Guard route: Dev only (unless bypassed via env variables)
  if (
    process.env.NODE_ENV !== 'development' && 
    process.env.NEXT_PUBLIC_ENABLE_TEST_PAGE !== 'true' && 
    process.env.ENABLE_TEST_PAGE !== 'true'
  ) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'This endpoint is only available in development mode.' } }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { action, reflectionText, newEntryText, provider = 'groq', entryId, user_id } = body;

    // Fetch user context for DB writes
    let activeUserId = user_id;
    if (!activeUserId) {
      const authUser = await getAuthenticatedUser(request);
      activeUserId = authUser?.userId;
    }
    // Final fallback: fetch first user from DB if not authenticated to prevent blocking developers
    if (!activeUserId) {
      const { data: users } = await supabase.from('users').select('id').limit(1);
      activeUserId = users?.[0]?.id || null;
    }

    const aiProvider = getAIProvider(provider);

    // ==========================================
    // ACTION: RUN SCORING ONLY (Synchronous)
    // ==========================================
    if (action === 'run-scoring') {
      const startTime = Date.now();
      
      const pipelineResult = await executeScoringPipeline(
        reflectionText || null,
        newEntryText || null,
        null,
        provider,
        entryId || null
      );
      
      const latency = pipelineResult.latency;
      const tracing = aiProvider as any;

      if (!pipelineResult.success || !pipelineResult.scoreResult) {
        return NextResponse.json({
          success: false,
          errorReason: pipelineResult.errorReason || 'AI scoring pipeline failed validation or parsing.',
          retryCount: pipelineResult.retryCount,
          latency: pipelineResult.latency,
          aiTrace: {
            systemPrompt: tracing.lastSystemPrompt || '',
            userContent: tracing.lastUserContent || '',
            rawResponse: pipelineResult.rawResponse || tracing.lastRawResponse || '',
            usage: tracing.lastUsage || null,
            provider: provider,
            latency
          }
        });
      }

      const scoreResult = pipelineResult.scoreResult;

      // Compute entry type
      const hasReflection = !!(reflectionText && reflectionText.trim());
      const hasNewEntry = !!(newEntryText && newEntryText.trim());
      let entryType = 'Empty';
      if (hasReflection && hasNewEntry) {
        entryType = 'Both';
      } else if (hasNewEntry) {
        entryType = 'New Only';
      } else if (hasReflection) {
        entryType = 'Reflection Only';
      }

      // Compute weighted day scores (CBT logic: 25/75 weight)
      let day_ei: number | null = null;
      let day_pr: number | null = null;
      let day_sa: number | null = null;

      if (entryType === 'Both' && scoreResult.reflection && scoreResult.newEntry) {
        day_ei = parseFloat((scoreResult.reflection.ei * 0.25 + scoreResult.newEntry.ei * 0.75).toFixed(2));
        day_pr = parseFloat((scoreResult.reflection.pr * 0.25 + scoreResult.newEntry.pr * 0.75).toFixed(2));
        day_sa = parseFloat((scoreResult.reflection.sa * 0.25 + scoreResult.newEntry.sa * 0.75).toFixed(2));
      } else if (entryType === 'New Only' && scoreResult.newEntry) {
        day_ei = scoreResult.newEntry.ei;
        day_pr = scoreResult.newEntry.pr;
        day_sa = scoreResult.newEntry.sa;
      } else if (entryType === 'Reflection Only' && scoreResult.reflection) {
        day_ei = scoreResult.reflection.ei;
        day_pr = scoreResult.reflection.pr;
        day_sa = scoreResult.reflection.sa;
      }

      // Evaluate crisis triggers using the 4-layered framework
      const crisisResult = await evaluateCrisisLayers(
        newEntryText || null,
        provider,
        {
          day_ei,
          day_sa,
          riskLanguageDetected: scoreResult.riskLanguageDetected,
          riskLanguageQuote: scoreResult.riskLanguageQuote
        }
      );

      const crisisFlag = crisisResult.crisisFlag;
      const crisisType = crisisResult.crisisType;
      const isImmediateDistress = crisisResult.triggeredLayers.includes('Layer 3 (Score Threshold)');
      const isRiskLanguage = crisisResult.triggeredLayers.includes('Layer 1 (Keyword Match)') || 
                           crisisResult.triggeredLayers.includes('Layer 2 (Semantic AI Check)') ||
                           crisisResult.triggeredLayers.includes('Layer 4 (Combined Logic)');

      return NextResponse.json({
        success: true,
        entryType,
        scoreResult,
        calculatedScores: {
          day_ei,
          day_pr,
          day_sa
        },
        crisis: {
          crisisFlag,
          crisisType,
          isImmediateDistress,
          isRiskLanguage,
          explanation: crisisResult.explanation,
          reflectionSuppressed: crisisFlag
        },
        aiTrace: {
          systemPrompt: tracing.lastSystemPrompt || '',
          userContent: tracing.lastUserContent || '',
          rawResponse: pipelineResult.rawResponse || tracing.lastRawResponse || '',
          usage: tracing.lastUsage || null,
          provider: provider,
          latency,
          retryCount: pipelineResult.retryCount
        }
      });
    }

    // ==========================================
    // ACTION: RUN CRISIS ONLY (Synchronous)
    // ==========================================
    if (action === 'run-crisis') {
      const startTime = Date.now();
      const content = newEntryText || '';
      
      const crisisResult = await evaluateCrisisLayers(content, provider, null);
      
      const latency = Date.now() - startTime;
      const tracing = aiProvider as any;

      const isImmediateDistress = crisisResult.triggeredLayers.includes('Layer 3 (Score Threshold)');
      const isRiskLanguage = crisisResult.triggeredLayers.includes('Layer 1 (Keyword Match)') || 
                           crisisResult.triggeredLayers.includes('Layer 2 (Semantic AI Check)') ||
                           crisisResult.triggeredLayers.includes('Layer 4 (Combined Logic)');

      return NextResponse.json({
        success: true,
        crisis: {
          crisisFlag: crisisResult.crisisFlag,
          crisisType: crisisResult.crisisType,
          isImmediateDistress,
          isRiskLanguage,
          explanation: crisisResult.explanation,
          reflectionSuppressed: crisisResult.crisisFlag
        },
        aiTrace: {
          systemPrompt: tracing.lastSystemPrompt || '',
          userContent: tracing.lastUserContent || '',
          rawResponse: tracing.lastRawResponse || '',
          usage: tracing.lastUsage || null,
          provider: provider,
          latency
        }
      });
    }

    // ==========================================
    // ACTION: RUN REFLECTION ONLY (Synchronous)
    // ==========================================
    if (action === 'run-reflection') {
      const startTime = Date.now();
      const content = newEntryText || '';
      
      // Fetch user contexts if available
      let personalityContext: string | undefined = undefined;
      let threadContext = 'None';
      let previousReflectionContext = 'None';

      if (activeUserId) {
        // Fetch personality
        const { data: user } = await supabase
          .from('users')
          .select('personality_summary_text')
          .eq('id', activeUserId)
          .maybeSingle();
        personalityContext = user?.personality_summary_text || undefined;

        // Fetch latest completed thread response
        const { data: latestThreadResponse } = await supabase
          .from('thread_responses')
          .select('response_text, created_at, thread_id')
          .eq('user_id', activeUserId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestThreadResponse) {
          const { data: thread } = await supabase
            .from('threads')
            .select('closing_question')
            .eq('id', latestThreadResponse.thread_id)
            .maybeSingle();
          if (thread) {
            threadContext = `Question: "${thread.closing_question}" | Answer: "${latestThreadResponse.response_text}"`;
          }
        }

        // Fetch previous reflection context
        const { data: latestReflection } = await supabase
          .from('reflections')
          .select('reflection_text, closing_question')
          .eq('user_id', activeUserId)
          .eq('status', 'ready')
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestReflection) {
          previousReflectionContext = `Observation: "${latestReflection.reflection_text}" | Question: "${latestReflection.closing_question}"`;
        }
      }

      // Generation/validation loop (up to 3 attempts, synchronous for developer debugging)
      let attempts = 0;
      let success = false;
      let result: any = null;
      let validation: any = null;
      let validationErrorMsg = '';

      const aiProviderInstance = getAIProvider(provider);

      while (attempts < 3 && !success) {
        attempts++;
        try {
          const useSimplifiedPrompt = attempts === 3;
          const contextWithRetryFeedback = attempts === 2
            ? `${personalityContext || ''}\n(Correction note: The previous output failed validation. Reason: ${validationErrorMsg}. Please strictly ensure there is no advice, suggestion, or therapeutic label in your response.)`
            : personalityContext;

          result = await aiProviderInstance.generateReflection(
            content,
            contextWithRetryFeedback,
            threadContext,
            previousReflectionContext,
            useSimplifiedPrompt
          );
          
          validation = validateReflection(result.reflection || '');
          if (validation.valid) {
            success = true;
          } else {
            validationErrorMsg = validation.reason || 'Failed validation rules';
          }
        } catch (err: any) {
          validationErrorMsg = err.message || 'AI generation failed';
        }
      }

      const latency = Date.now() - startTime;
      const tracing = aiProviderInstance as any;

      const fullReflection = result?.reflection 
        ? `${result.reflection.trim()}\n\n${(result.closing_nudge || 'Sit with that tonight.\nCome back tomorrow and tell me what came up.').trim()}` 
        : null;

      const systemPromptText = tracing.lastSystemPrompt || '';
      const userContentText = tracing.lastUserContent || '';
      const promptSize = systemPromptText.length + userContentText.length;
      const estimatedTokens = tracing.lastUsage?.total_tokens || Math.round(promptSize / 4);

      return NextResponse.json({
        success,
        reflection: fullReflection,
        closingQuestion: result?.closing_question || null,
        classification: result?.classification || null,
        confidence: result?.confidence || 'low',
        themes: result?.themes || [],
        vocabulary: result?.vocabulary || [],
        processingNotes: result?.processing_notes || '',
        validation: validation || { valid: false, reason: validationErrorMsg },
        attempts,
        storageStatus: 'Skipped (testing only)',
        aiTrace: {
          systemPrompt: systemPromptText,
          userContent: userContentText,
          rawResponse: tracing.lastRawResponse || '',
          usage: tracing.lastUsage || { prompt_tokens: Math.round(systemPromptText.length / 4), completion_tokens: 0, total_tokens: estimatedTokens },
          provider: provider,
          latency,
          promptSize,
          estimatedTokens
        }
      });
    }

    // ==========================================
    // ACTION: RUN SCORE + REFLECTION (Synchronous)
    // ==========================================
    if (action === 'run-score-reflection') {
      const startTime = Date.now();
      
      // 1. Run Scoring Pipeline
      const scoringResult = await executeScoringPipeline(
        reflectionText || null,
        newEntryText || null,
        null,
        provider,
        entryId || null
      );

      const aiProviderInstance = getAIProvider(provider);
      const tracing = aiProviderInstance as any;
      let scoringLatency = scoringResult.latency;

      if (!scoringResult.success || !scoringResult.scoreResult) {
        return NextResponse.json({
          success: false,
          stage: 'scoring',
          errorReason: scoringResult.errorReason || 'AI scoring pipeline failed validation or parsing.',
          aiTrace: {
            systemPrompt: tracing.lastSystemPrompt || '',
            userContent: tracing.lastUserContent || '',
            rawResponse: scoringResult.rawResponse || tracing.lastRawResponse || '',
            usage: tracing.lastUsage || null,
            provider: provider,
            latency: scoringLatency
          }
        });
      }

      const scoreResult = scoringResult.scoreResult;
      
      // Compute entry type
      const hasReflection = !!(reflectionText && reflectionText.trim());
      const hasNewEntry = !!(newEntryText && newEntryText.trim());
      let entryType = 'Empty';
      if (hasReflection && hasNewEntry) {
        entryType = 'Both';
      } else if (hasNewEntry) {
        entryType = 'New Only';
      } else if (hasReflection) {
        entryType = 'Reflection Only';
      }

      // Compute weighted scores
      let day_ei: number | null = null;
      let day_pr: number | null = null;
      let day_sa: number | null = null;

      if (entryType === 'Both' && scoreResult.reflection && scoreResult.newEntry) {
        day_ei = parseFloat((scoreResult.reflection.ei * 0.25 + scoreResult.newEntry.ei * 0.75).toFixed(2));
        day_pr = parseFloat((scoreResult.reflection.pr * 0.25 + scoreResult.newEntry.pr * 0.75).toFixed(2));
        day_sa = parseFloat((scoreResult.reflection.sa * 0.25 + scoreResult.newEntry.sa * 0.75).toFixed(2));
      } else if (entryType === 'New Only' && scoreResult.newEntry) {
        day_ei = scoreResult.newEntry.ei;
        day_pr = scoreResult.newEntry.pr;
        day_sa = scoreResult.newEntry.sa;
      } else if (entryType === 'Reflection Only' && scoreResult.reflection) {
        day_ei = scoreResult.reflection.ei;
        day_pr = scoreResult.reflection.pr;
        day_sa = scoreResult.reflection.sa;
      }

      // Evaluate Crisis
      const crisisResult = await evaluateCrisisLayers(
        newEntryText || null,
        provider,
        {
          day_ei,
          day_sa,
          riskLanguageDetected: scoreResult.riskLanguageDetected,
          riskLanguageQuote: scoreResult.riskLanguageQuote
        }
      );

      let reflectionTextOutput = '';
      let reflectionConfidence = 'low';
      let reflectionThemes: string[] = [];
      let reflectionValidation: any = null;
      let reflectionAttempts = 0;
      let reflectionTrace: any = null;
      let reflectionSuppressed = crisisResult.crisisFlag;
      let result: any = null;

      if (reflectionSuppressed) {
        reflectionTextOutput = 'Reflection suppressed due to crisis protocol.';
      } else {
        // Run Reflection Generation
        const reflStart = Date.now();
        
        // Fetch contexts
        let personalityContext: string | undefined = undefined;
        let threadContext = 'None';
        let previousReflectionContext = 'None';

        if (activeUserId) {
          const { data: user } = await supabase
            .from('users')
            .select('personality_summary_text')
            .eq('id', activeUserId)
            .maybeSingle();
          personalityContext = user?.personality_summary_text || undefined;

          // Fetch latest completed thread response
          const { data: latestThreadResponse } = await supabase
            .from('thread_responses')
            .select('response_text, created_at, thread_id')
            .eq('user_id', activeUserId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestThreadResponse) {
            const { data: thread } = await supabase
              .from('threads')
              .select('closing_question')
              .eq('id', latestThreadResponse.thread_id)
              .maybeSingle();
            if (thread) {
              threadContext = `Question: "${thread.closing_question}" | Answer: "${latestThreadResponse.response_text}"`;
            }
          }

          // Fetch previous reflection context
          const { data: latestReflection } = await supabase
            .from('reflections')
            .select('reflection_text, closing_question')
            .eq('user_id', activeUserId)
            .eq('status', 'ready')
            .order('generated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestReflection) {
            previousReflectionContext = `Observation: "${latestReflection.reflection_text}" | Question: "${latestReflection.closing_question}"`;
          }
        }

        let attempts = 0;
        let success = false;
        result = null;
        let validationErrorMsg = '';

        while (attempts < 3 && !success) {
          attempts++;
          try {
            const useSimplifiedPrompt = attempts === 3;
            const contextWithRetryFeedback = attempts === 2
              ? `${personalityContext || ''}\n(Correction note: The previous output failed validation. Reason: ${validationErrorMsg}. Please strictly ensure there is no advice, suggestion, or therapeutic label in your response.)`
              : personalityContext;

            result = await aiProviderInstance.generateReflection(
              newEntryText || '',
              contextWithRetryFeedback,
              threadContext,
              previousReflectionContext,
              useSimplifiedPrompt
            );
            
            reflectionValidation = validateReflection(result.reflection || '');
            if (reflectionValidation.valid) {
              success = true;
            } else {
              validationErrorMsg = reflectionValidation.reason || 'Failed validation rules';
            }
          } catch (err: any) {
            validationErrorMsg = err.message || 'AI generation failed';
          }
        }

        const reflLatency = Date.now() - reflStart;
        reflectionTextOutput = result?.reflection 
          ? `${result.reflection.trim()}\n\n${(result.closing_nudge || 'Sit with that tonight.\nCome back tomorrow and tell me what came up.').trim()}` 
          : '';
        reflectionConfidence = result?.confidence || 'low';
        reflectionThemes = result?.themes || [];
        reflectionAttempts = attempts;
        if (!reflectionValidation) {
          reflectionValidation = { valid: false, reason: validationErrorMsg };
        }

        const systemPromptText = tracing.lastSystemPrompt || '';
        const userContentText = tracing.lastUserContent || '';
        const promptSize = systemPromptText.length + userContentText.length;
        const estimatedTokens = tracing.lastUsage?.total_tokens || Math.round(promptSize / 4);

        reflectionTrace = {
          systemPrompt: systemPromptText,
          userContent: userContentText,
          rawResponse: tracing.lastRawResponse || '',
          usage: tracing.lastUsage || { prompt_tokens: Math.round(systemPromptText.length / 4), completion_tokens: 0, total_tokens: estimatedTokens },
          provider: provider,
          latency: reflLatency,
          promptSize,
          estimatedTokens
        };
      }

      const totalLatency = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        entryType,
        scoreResult,
        calculatedScores: {
          day_ei,
          day_pr,
          day_sa
        },
        crisis: {
          crisisFlag: crisisResult.crisisFlag,
          crisisType: crisisResult.crisisType,
          explanation: crisisResult.explanation,
          reflectionSuppressed
        },
        reflection: {
          reflectionText: reflectionTextOutput,
          closingQuestion: result?.closing_question || null,
          classification: result?.classification || null,
          confidence: reflectionConfidence,
          themes: reflectionThemes,
          vocabulary: result?.vocabulary || [],
          validation: reflectionValidation,
          attempts: reflectionAttempts,
          suppressed: reflectionSuppressed
        },
        scoringTrace: {
          systemPrompt: scoringResult.scoreResult ? (aiProviderInstance as any).lastSystemPrompt : '',
          userContent: (aiProviderInstance as any).lastUserContent || '',
          rawResponse: scoringResult.rawResponse || (aiProviderInstance as any).lastRawResponse || '',
          usage: (aiProviderInstance as any).lastUsage || null,
          provider: provider,
          latency: scoringLatency,
          retryCount: scoringResult.retryCount
        },
        reflectionTrace,
        storageStatus: 'Skipped (testing only)',
        totalLatency
      });
    }

    // ==========================================
    // ACTION: RUN FULL PIPELINE (Asynchronous)
    // ==========================================
    if (action === 'run-full') {
      if (!activeUserId) {
        return NextResponse.json({ error: { code: 'USER_REQUIRED', message: 'No valid user found to associate DB write.' } }, { status: 400 });
      }

      // Find or create active cycle for the user
      let { data: cycle } = await supabase
        .from('cycles')
        .select('id, start_date')
        .eq('user_id', activeUserId)
        .in('status', ['ACTIVE', 'active'])
        .maybeSingle();

      if (!cycle) {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: newCycle, error: insertErr } = await supabase
          .from('cycles')
          .insert({
            user_id: activeUserId,
            status: 'ACTIVE',
            cycle_number: 1,
            start_date: todayStr,
            total_days: 30,
            current_day: 1,
            days_completed: 0,
            entries_count: 0,
            assessment_completed: false,
            assessment_available: false
          })
          .select()
          .single();
        
        if (insertErr) {
          console.error('[API Test Pipeline] Failed to create test active cycle:', insertErr);
        }
        cycle = newCycle;
      }

      const hasReflection = !!(reflectionText && reflectionText.trim());
      const hasNewEntry = !!(newEntryText && newEntryText.trim());
      let entry_type = 'empty';
      if (hasReflection && hasNewEntry) {
        entry_type = 'both';
      } else if (hasNewEntry) {
        entry_type = 'new_only';
      } else if (hasReflection) {
        entry_type = 'reflection_only';
      }

      // Write test entry to Supabase
      const wordCount = (newEntryText || '').trim().split(/\s+/).filter(Boolean).length;
      const { data: entry, error: insertError } = await supabase
        .from('entries')
        .insert({
          user_id: activeUserId,
          cycle_id: cycle?.id || null,
          cycle_day: 10,
          content: newEntryText || '',
          new_entry_text_encrypted: newEntryText || '',
          reflection_text_encrypted: reflectionText || '',
          entry_type,
          word_count: wordCount,
          written_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('[Test API] DB Insert Error:', insertError);
        return NextResponse.json({ error: { code: 'DATABASE_ERROR', message: `DB insert failed: ${insertError.message}` } }, { status: 500 });
      }

      // Enqueue BullMQ background jobs (or run inline as fallback)
      const entryId = entry.id;
      const jobIds = {
        scoring: `score_${entryId}`,
        reflection: `refl_${entryId}`,
        crisis: `crisis_${entryId}`
      };

      let runInline = process.env.BYPASS_REDIS === 'true' || connection.status !== 'ready';

      if (!runInline) {
        try {
          // Sequential queue chaining: only enqueue the entry_scoring job initially
          await queueRegistry.addJob('entry_scoring', jobIds.scoring, {
            entry_id: entryId,
            user_id: activeUserId
          });
          console.log('[Test API] Enqueued BullMQ entry_scoring job successfully.');
        } catch (err) {
          console.warn('[Test API] Redis/BullMQ connection failed. Running pipeline inline instead.', err);
          runInline = true;
        }
      }

      if (runInline) {
        console.log('[Test API] Running workers synchronously inline...');
        try {
          // Execute sequential workers (Reflection depends on Scoring & Crisis being done first)
          await processEntryScoring({ entry_id: entryId, user_id: activeUserId });
          // If BYPASS_REDIS is enabled, the worker chain is automatically executed inline synchronously via queueRegistry.
          // We only call the subsequent workers manually here if BYPASS_REDIS is disabled.
          if (process.env.BYPASS_REDIS !== 'true') {
            await processCrisisDetection({ entry_id: entryId, user_id: activeUserId });
            await processReflectionGeneration({ entry_id: entryId, user_id: activeUserId });
          }
          console.log('[Test API] Synchronous worker execution completed successfully.');
        } catch (inlineErr: any) {
          console.error('[Test API] Error running workers inline:', inlineErr);
          // Return the error to the client if inline worker run failed
          return NextResponse.json({ 
            error: { 
              code: 'PIPELINE_INLINE_FAILURE', 
              message: `Synchronous pipeline run failed: ${inlineErr.message || inlineErr}` 
            } 
          }, { status: 500 });
        }
      }

      return NextResponse.json({
        success: true,
        message: runInline 
          ? 'Successfully executed pipeline synchronously (Redis bypassed/unavailable).'
          : 'Successfully inserted entry to Supabase and enqueued BullMQ jobs.',
        entryId,
        userId: activeUserId,
        jobIds
      });
    }

    if (action === 'job-status') {
      if (!entryId) {
        return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Missing entryId for job tracking.' } }, { status: 400 });
      }

      // 1. Fetch updated states from DB first to support synchronous / offline fallback
      const [entryRes, reflectionRes] = await Promise.all([
        supabase.from('entries').select('*').eq('id', entryId).maybeSingle(),
        supabase.from('reflections').select('id, status, reflection_text, provider, confidence, themes, closing_question, classification').eq('entry_id', entryId).maybeSingle()
      ]);

      const updatedEntry = entryRes.data;
      const reflection = reflectionRes.data;

      // Fetch vocab details, concepts and run deterministic extraction
      let vocabWords: string[] = [];
      let vocabDetails: any[] = [];
      let clusterDetails: any[] = [];
      let conceptsDetails: any[] = [];
      let rawWords: string[] = [];
      let ignoredWords: string[] = [];
      let extractedWords: any[] = [];

      if (updatedEntry?.cycle_id) {
        const { data: vocabRes } = await supabase
          .from('vocab_words')
          .select('word, normalized_word, frequency, is_emotional, emotional_score, entry_ids')
          .eq('user_id', updatedEntry.user_id)
          .eq('cycle_id', updatedEntry.cycle_id);
        
        vocabDetails = vocabRes || [];

        // Fetch entry-specific vocabulary words from extractions
        const { data: extRes, error: extErr } = await supabase
          .from('vocab_extractions')
          .select('word')
          .eq('user_id', updatedEntry.user_id)
          .eq('entry_id', updatedEntry.id);
        
        if (!extErr && extRes) {
          vocabWords = extRes.map((v: any) => v.word);
        } else {
          vocabWords = vocabDetails
            ? vocabDetails.filter((v: any) => Array.isArray(v.entry_ids) && v.entry_ids.includes(updatedEntry.id)).map((v: any) => v.word)
            : [];
        }

        const { data: clusterRes } = await supabase
          .from('vocab_clusters')
          .select('cluster_name, cluster_type, word_count, frequency')
          .eq('user_id', updatedEntry.user_id)
          .eq('cycle_id', updatedEntry.cycle_id);
        
        clusterDetails = clusterRes || [];

        const { data: conceptsRes } = await supabase
          .from('vocab_concepts')
          .select('concept, frequency, confidence')
          .eq('user_id', updatedEntry.user_id)
          .eq('cycle_id', updatedEntry.cycle_id);
        
        conceptsDetails = conceptsRes || [];

        // Run deterministic extraction on entry content for test diagnostics
        const entryText = decrypt(updatedEntry.new_entry_text_encrypted, updatedEntry.new_entry_text_iv) || updatedEntry.content || '';
        const extraction = extractVocabularyDeterministic(entryText);
        rawWords = extraction.rawWords;
        ignoredWords = extraction.ignoredWords;
        extractedWords = extraction.extracted;
      }

      const getJobStats = async (queueName: any, jobId: string) => {
        // If DB indicates the processing has completed, return COMPLETED status immediately
        if (updatedEntry) {
          if (queueName === 'entry_scoring' && updatedEntry.scoring_status === 'scored') {
            return { id: jobId, status: 'COMPLETED', executionTime: 0, attemptsMade: 1 };
          }
          if (queueName === 'crisis_detection' && updatedEntry.crisis_checked) {
            return { id: jobId, status: 'COMPLETED', executionTime: 0, attemptsMade: 1 };
          }
          if (queueName === 'reflection_generation') {
            if (reflection || updatedEntry.crisis_flag || updatedEntry.reflection_suppressed) {
              return { id: jobId, status: 'COMPLETED', executionTime: 0, attemptsMade: 1 };
            }
          }
          if (queueName === 'vocab_processing') {
            if (process.env.BYPASS_REDIS === 'true' && (reflection || updatedEntry.crisis_flag || updatedEntry.reflection_suppressed)) {
              return { id: jobId, status: 'COMPLETED', executionTime: 0, attemptsMade: 1 };
            }
          }
        }

        // Otherwise query Redis queue
        try {
          const queue = queueRegistry.getQueue(queueName);
          const job = await queue.getJob(jobId);
          if (!job) {
            // Fallback: if job is not found in Redis (e.g. deleted after completion or Redis bypassed),
            // but the reflection (which triggers vocab) is ready, then vocab processing is completed.
            if (reflection || updatedEntry.crisis_flag || updatedEntry.reflection_suppressed) {
              return { id: jobId, status: 'COMPLETED', executionTime: 0, attemptsMade: 1 };
            }
            return { id: jobId, status: 'NOT_QUEUED', executionTime: null };
          }
          const state = await job.getState();
          let status = 'QUEUED';
          if (state === 'active') status = 'PROCESSING';
          else if (state === 'completed') status = 'COMPLETED';
          else if (state === 'failed') status = 'FAILED';

          const executionTime = (job.processedOn && job.finishedOn) ? (job.finishedOn - job.processedOn) : null;
          return {
            id: jobId,
            status,
            executionTime,
            failedReason: job.failedReason || null,
            attemptsMade: job.attemptsMade
          };
        } catch (err) {
          // If Redis is offline/unavailable, return UNKNOWN
          return { id: jobId, status: 'UNKNOWN', executionTime: null, error: String(err) };
        }
      };

      const [scoringJob, reflectionJob, crisisJob, vocabJob] = await Promise.all([
        getJobStats('entry_scoring', `score_${entryId}`),
        getJobStats('reflection_generation', `refl_${entryId}`),
        getJobStats('crisis_detection', `crisis_${entryId}`),
        getJobStats('vocab_processing', `vocab_${entryId}`)
      ]);

      return NextResponse.json({
        success: true,
        jobs: {
          scoring: scoringJob,
          reflection: reflectionJob,
          crisis: crisisJob,
          vocab: vocabJob
        },
        entryState: updatedEntry || null,
        reflectionState: reflection ? {
          ...reflection,
          vocabulary: vocabWords
        } : null,
        vocabState: {
          words: vocabDetails,
          clusters: clusterDetails,
          concepts: conceptsDetails,
          rawWords,
          ignoredWords,
          extracted: extractedWords,
          cycleInfo: updatedEntry?.cycle_id ? {
            cycle_id: updatedEntry.cycle_id,
            cycle_day: updatedEntry.cycle_day
          } : null
        }
      });
    }

    if (action === 'db-compliance-check') {
      const [reflectionsCheck, entriesCheck, assessmentsCheck, threadsCheck, responsesCheck] = await Promise.all([
        supabase.from('reflections').select('closing_question, classification').limit(1),
        supabase.from('entries').select('arc_scoring_note').limit(1),
        supabase.from('assessments').select('dominant_dimension').limit(1),
        supabase.from('threads').select('id, user_id, cycle_id, reflection_id, closing_question, status, draft_response, created_at, answered_at').limit(1),
        supabase.from('thread_responses').select('id, thread_id, user_id, response_text, created_at, used_for_scoring').limit(1)
      ]);

      return NextResponse.json({
        success: true,
        schema: {
          reflections: !reflectionsCheck.error,
          reflectionsError: reflectionsCheck.error?.message || null,
          entries: !entriesCheck.error,
          entriesError: entriesCheck.error?.message || null,
          assessments: !assessmentsCheck.error,
          assessmentsError: assessmentsCheck.error?.message || null,
          threads: !threadsCheck.error,
          threadsError: threadsCheck.error?.message || null,
          thread_responses: !responsesCheck.error,
          thread_responsesError: responsesCheck.error?.message || null
        }
      });
    }

    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid action parameter.' } }, { status: 400 });

  } catch (error: any) {
    console.error('[Test API] Error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected error occurred.' } }, { status: 500 });
  }
}
