import { Queue } from 'bullmq';
import { defaultQueueOptions } from './config';

export const QUEUE_NAMES = {
  ENTRY_SCORING: 'entry_scoring',
  REFLECTION_GENERATION: 'reflection_generation',
  WEEKLY_SUMMARY_GENERATION: 'weekly_summary_generation',
  MONTHLY_REPORT_GENERATION: 'monthly_report_generation',
  OCEAN_SUMMARY_GENERATION: 'ocean_summary_generation',
  EXERCISE_INSIGHT_GENERATION: 'exercise_insight_generation',
  CRISIS_DETECTION: 'crisis_detection',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

class QueueRegistry {
  private queues: Map<string, Queue> = new Map();

  constructor() {
    this.initializeQueues();
  }

  private initializeQueues() {
    Object.values(QUEUE_NAMES).forEach((queueName) => {
      this.queues.set(
        queueName,
        new Queue(queueName, defaultQueueOptions)
      );
    });
    console.log(`[Queue Registry] Instantiated ${this.queues.size} BullMQ queues.`);
  }

  public getQueue(name: QueueName): Queue {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Queue "${name}" not found in registry.`);
    }
    return queue;
  }

  public async addJob(
    queueName: QueueName,
    jobName: string,
    data: any,
    jobId?: string
  ) {
    const queue = this.getQueue(queueName);
    const options = jobId ? { jobId } : {};
    return queue.add(jobName, data, options);
  }

  public async closeAll() {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    this.queues.clear();
    console.log('[Queue Registry] All queues closed.');
  }
}

export const queueRegistry = new QueueRegistry();
