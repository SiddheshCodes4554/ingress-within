import { Worker } from 'bullmq';
import { defaultWorkerOptions } from './config';
import { QUEUE_NAMES } from './registry';
import { processEntryScoring } from './workers/entryScoringWorker';
import { processReflectionGeneration } from './workers/reflectionWorker';
import { processWeeklySummary } from './workers/weeklySummaryWorker';
import { processMonthlyReport } from './workers/monthlyReportWorker';
import { processOceanSummary } from './workers/oceanSummaryWorker';
import { processExerciseInsight } from './workers/exerciseInsightWorker';
import { processCrisisDetection } from './workers/crisisDetectionWorker';
import { processVocabularyExtraction } from './workers/vocabWorker';

class WorkerRegistry {
  private workers: Map<string, Worker> = new Map();

  public startAll() {
    if (process.env.BYPASS_REDIS === 'true') {
      console.log('[Worker Registry] BYPASS_REDIS is enabled. Skipping background worker instantiation.');
      return;
    }
    if (this.workers.size > 0) {
      console.warn('[Worker Registry] Workers are already running.');
      return;
    }

    // 1. Entry Scoring Worker
    this.workers.set(
      QUEUE_NAMES.ENTRY_SCORING,
      new Worker(QUEUE_NAMES.ENTRY_SCORING, async (job) => {
        await processEntryScoring(job.data);
      }, defaultWorkerOptions)
    );

    // 2. Reflection Generation Worker
    this.workers.set(
      QUEUE_NAMES.REFLECTION_GENERATION,
      new Worker(QUEUE_NAMES.REFLECTION_GENERATION, async (job) => {
        await processReflectionGeneration(job.data);
      }, defaultWorkerOptions)
    );

    // 3. Weekly Summary Generation Worker
    this.workers.set(
      QUEUE_NAMES.WEEKLY_SUMMARY_GENERATION,
      new Worker(QUEUE_NAMES.WEEKLY_SUMMARY_GENERATION, async (job) => {
        const { cycle_id, user_id, week_number, summary_id, is_validation_job } = job.data;
        if (is_validation_job) {
          const { weeklyReportOrchestrator } = await import('../weeklyReportOrchestrator');
          await weeklyReportOrchestrator.validateAndGenerateReport(summary_id, user_id, cycle_id, week_number);
        } else {
          await processWeeklySummary(job.data);
        }
      }, defaultWorkerOptions)
    );

    // 4. Monthly Report Generation Worker
    this.workers.set(
      QUEUE_NAMES.MONTHLY_REPORT_GENERATION,
      new Worker(QUEUE_NAMES.MONTHLY_REPORT_GENERATION, async (job) => {
        await processMonthlyReport(job.data);
      }, defaultWorkerOptions)
    );

    // 5. OCEAN Summary Generation Worker
    this.workers.set(
      QUEUE_NAMES.OCEAN_SUMMARY_GENERATION,
      new Worker(QUEUE_NAMES.OCEAN_SUMMARY_GENERATION, async (job) => {
        await processOceanSummary(job.data);
      }, defaultWorkerOptions)
    );

    // 6. Exercise Insight Generation Worker
    this.workers.set(
      QUEUE_NAMES.EXERCISE_INSIGHT_GENERATION,
      new Worker(QUEUE_NAMES.EXERCISE_INSIGHT_GENERATION, async (job) => {
        await processExerciseInsight(job.data);
      }, defaultWorkerOptions)
    );

    // 7. Crisis Detection Worker
    this.workers.set(
      QUEUE_NAMES.CRISIS_DETECTION,
      new Worker(QUEUE_NAMES.CRISIS_DETECTION, async (job) => {
        await processCrisisDetection(job.data);
      }, defaultWorkerOptions)
    );

    // 8. Vocabulary Processing Worker
    this.workers.set(
      QUEUE_NAMES.VOCAB_PROCESSING || 'vocab_processing',
      new Worker(QUEUE_NAMES.VOCAB_PROCESSING || 'vocab_processing', async (job) => {
        await processVocabularyExtraction(job.data);
      }, defaultWorkerOptions)
    );

    // Add event listeners for logging
    for (const [name, worker] of this.workers.entries()) {
      worker.on('failed', (job, err) => {
        console.error(`[BullMQ Worker: ${name}] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message);
      });
      worker.on('completed', (job) => {
        console.log(`[BullMQ Worker: ${name}] Job ${job?.id} completed successfully.`);
      });
    }

    console.log(`[Worker Registry] Started ${this.workers.size} BullMQ workers.`);
  }

  public async stopAll() {
    for (const [name, worker] of this.workers.entries()) {
      await worker.close();
      console.log(`[Worker Registry] Closed worker: ${name}`);
    }
    this.workers.clear();
  }
}

export const workerRegistry = new WorkerRegistry();
