import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';
import { getAIProvider } from '../../../lib/ai/factory';
import { queueRegistry } from '../../../lib/queue/registry';
import { getAuthenticatedUser } from '../../../lib/auth-helper';

export async function POST(request: NextRequest) {
  // 1. Guard route: Dev only
  if (process.env.NODE_ENV !== 'development') {
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
      
      const scoreResult = await aiProvider.scoreEntryDimensions(
        reflectionText || null,
        newEntryText || null,
        'Developer testing context'
      );
      
      const latency = Date.now() - startTime;
      const tracing = aiProvider as any;

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

      // Evaluate crisis triggers
      const isImmediateDistress = day_ei !== null && day_sa !== null && day_ei >= 9 && day_sa <= 2;
      const isRiskLanguage = !!scoreResult.riskLanguageDetected;
      const crisisFlag = isImmediateDistress || isRiskLanguage;
      const crisisType = isRiskLanguage ? 'Risk_Language' : (isImmediateDistress ? 'Immediate' : null);

      // Construct explanation for crisis trigger
      let explanation = '';
      if (crisisFlag) {
        explanation += `Crisis triggered. Reason: `;
        if (isRiskLanguage) {
          explanation += `Risk language detected with quote: "${scoreResult.riskLanguageQuote}". `;
        }
        if (isImmediateDistress) {
          explanation += `EI (${day_ei}) >= 9 and SA (${day_sa}) <= 2. `;
        }
      } else {
        explanation = `No crisis triggered. `;
        if (day_ei !== null && day_sa !== null) {
          if (day_ei < 9 && day_sa > 2) {
            explanation += `Both thresholds were clean: EI (${day_ei}) < 9 and SA (${day_sa}) > 2. `;
          } else if (day_ei >= 9 && day_sa > 2) {
            explanation += `EI (${day_ei}) is high but SA (${day_sa}) > 2 represents agency (hard day, not crisis). `;
          } else if (day_ei < 9 && day_sa <= 2) {
            explanation += `SA (${day_sa}) is low but EI (${day_ei}) < 9 shows no acute distress. `;
          }
        } else {
          explanation += `Insufficient text scores to evaluate thresholds. `;
        }
        if (!isRiskLanguage) {
          explanation += `No explicit risk language was identified.`;
        }
      }

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
          explanation,
          reflectionSuppressed: crisisFlag
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
    // ACTION: RUN CRISIS ONLY (Synchronous)
    // ==========================================
    if (action === 'run-crisis') {
      const startTime = Date.now();
      const content = newEntryText || '';
      
      const crisisResult = await aiProvider.detectCrisis(content);
      
      const latency = Date.now() - startTime;
      const tracing = aiProvider as any;

      let explanation = '';
      if (crisisResult.isCrisis) {
        explanation = `Risk language detected: ${crisisResult.reason}`;
      } else {
        explanation = `No explicit risk language detected in entry text.`;
      }

      return NextResponse.json({
        success: true,
        crisis: {
          crisisFlag: crisisResult.isCrisis,
          crisisType: crisisResult.isCrisis ? 'Risk_Language' : null,
          isImmediateDistress: false,
          isRiskLanguage: crisisResult.isCrisis,
          explanation,
          reflectionSuppressed: crisisResult.isCrisis
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

      // Enqueue BullMQ background jobs
      const entryId = entry.id;
      const jobIds = {
        scoring: `score_${entryId}`,
        reflection: `refl_${entryId}`,
        crisis: `crisis_${entryId}`
      };

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

      return NextResponse.json({
        success: true,
        message: 'Successfully inserted entry to Supabase and enqueued BullMQ jobs.',
        entryId,
        userId: activeUserId,
        jobIds
      });
    }

    // ==========================================
    // ACTION: TRACK JOB STATUS
    // ==========================================
    if (action === 'job-status') {
      if (!entryId) {
        return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Missing entryId for job tracking.' } }, { status: 400 });
      }

      const getJobStats = async (queueName: any, jobId: string) => {
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
          return { id: jobId, status: 'UNKNOWN', executionTime: null, error: String(err) };
        }
      };

      const [scoringJob, reflectionJob, crisisJob] = await Promise.all([
        getJobStats('entry_scoring', `score_${entryId}`),
        getJobStats('reflection_generation', `refl_${entryId}`),
        getJobStats('crisis_detection', `crisis_${entryId}`)
      ]);

      // Fetch the updated entry from Supabase to show written scores/flags
      const { data: updatedEntry } = await supabase
        .from('entries')
        .select('*')
        .eq('id', entryId)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        jobs: {
          scoring: scoringJob,
          reflection: reflectionJob,
          crisis: crisisJob
        },
        entryState: updatedEntry || null
      });
    }

    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid action parameter.' } }, { status: 400 });

  } catch (error: any) {
    console.error('[Test API] Error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected error occurred.' } }, { status: 500 });
  }
}
