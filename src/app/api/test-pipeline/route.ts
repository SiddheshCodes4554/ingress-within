import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';
import { getAIProvider } from '../../../lib/ai/factory';
import { queueRegistry } from '../../../lib/queue/registry';
import { getAuthenticatedUser } from '../../../lib/auth-helper';
import { processEntryScoring } from '../../../lib/queue/workers/entryScoringWorker';
import { processCrisisDetection } from '../../../lib/queue/workers/crisisDetectionWorker';
import { processReflectionGeneration } from '../../../lib/queue/workers/reflectionWorker';
import { connection } from '../../../lib/queue/config';
import { executeScoringPipeline } from '../../../lib/ai/pipeline';
import { evaluateCrisisLayers } from '../../../lib/crisis-detector';



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
        'Developer testing context',
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
    // ACTION: RUN FULL PIPELINE (Asynchronous)
    // ==========================================
    if (action === 'run-full') {
      if (!activeUserId) {
        return NextResponse.json({ error: { code: 'USER_REQUIRED', message: 'No valid user found to associate DB write.' } }, { status: 400 });
      }

      // Find or create active cycle for the user
      let { data: cycle } = await supabase
        .from('cycles')
        .select('id, started_at')
        .eq('user_id', activeUserId)
        .eq('status', 'active')
        .maybeSingle();

      if (!cycle) {
        const { data: newCycle } = await supabase
          .from('cycles')
          .insert({
            user_id: activeUserId,
            status: 'active',
            started_at: new Date().toISOString()
          })
          .select()
          .single();
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
          await Promise.all([
            queueRegistry.addJob('entry_scoring', jobIds.scoring, {
              entry_id: entryId,
              user_id: activeUserId
            }),
            queueRegistry.addJob('reflection_generation', jobIds.reflection, {
              entry_id: entryId,
              user_id: activeUserId
            }),
            queueRegistry.addJob('crisis_detection', jobIds.crisis, {
              entry_id: entryId,
              user_id: activeUserId
            })
          ]);
          console.log('[Test API] Enqueued BullMQ jobs successfully.');
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
          await processCrisisDetection({ entry_id: entryId, user_id: activeUserId });
          await processReflectionGeneration({ entry_id: entryId, user_id: activeUserId });
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
        supabase.from('reflections').select('id, status, question, observation').eq('entry_id', entryId).maybeSingle()
      ]);

      const updatedEntry = entryRes.data;
      const reflection = reflectionRes.data;

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
        }

        // Otherwise query Redis queue
        try {
          const queue = queueRegistry.getQueue(queueName);
          const job = await queue.getJob(jobId);
          if (!job) {
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

      const [scoringJob, reflectionJob, crisisJob] = await Promise.all([
        getJobStats('entry_scoring', `score_${entryId}`),
        getJobStats('reflection_generation', `refl_${entryId}`),
        getJobStats('crisis_detection', `crisis_${entryId}`)
      ]);

      return NextResponse.json({
        success: true,
        jobs: {
          scoring: scoringJob,
          reflection: reflectionJob,
          crisis: crisisJob
        },
        entryState: updatedEntry || null,
        reflectionState: reflection || null
      });
    }

    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid action parameter.' } }, { status: 400 });

  } catch (error: any) {
    console.error('[Test API] Error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected error occurred.' } }, { status: 500 });
  }
}
