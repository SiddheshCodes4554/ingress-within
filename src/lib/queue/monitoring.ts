import { queueRegistry, QUEUE_NAMES } from './registry';

export interface QueueMetric {
  queueName: string;
  activeCount: number;
  completedCount: number;
  failedCount: number; // DLQ
  delayedCount: number;
  waitingCount: number;
}

export async function getQueueMetrics(): Promise<QueueMetric[]> {
  if (process.env.BYPASS_REDIS === 'true') {
    return [];
  }
  const metrics: QueueMetric[] = [];

  for (const queueName of Object.values(QUEUE_NAMES)) {
    try {
      const queue = queueRegistry.getQueue(queueName);
      const [active, completed, failed, delayed, waiting] = await Promise.all([
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.getWaitingCount(),
      ]);

      metrics.push({
        queueName,
        activeCount: active,
        completedCount: completed,
        failedCount: failed,
        delayedCount: delayed,
        waitingCount: waiting,
      });
    } catch (err: any) {
      console.error(`[Queue Monitoring] Failed to fetch counts for ${queueName}:`, err.message);
    }
  }

  return metrics;
}

export async function printQueueStatus() {
  if (process.env.BYPASS_REDIS === 'true') {
    console.log('\n--- 📊 BULLMQ QUEUES STATUS REPORT ---');
    console.log('Redis/BullMQ is bypassed. Running inline instead.');
    console.log('---------------------------------------\n');
    return;
  }
  const metrics = await getQueueMetrics();
  console.log('\n--- 📊 BULLMQ QUEUES STATUS REPORT ---');
  console.table(metrics);
  console.log('---------------------------------------\n');
}
