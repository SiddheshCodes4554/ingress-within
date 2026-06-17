import { QueueOptions, WorkerOptions, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let lastErrorLoggedAt = 0;
const ERROR_LOG_THROTTLE_MS = 30000; // Log once every 30 seconds max to prevent spam
let isDisconnectedReported = false;

export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null, // Critical requirement for BullMQ
  enableOfflineQueue: false,  // Fail fast instead of buffering commands offline
  retryStrategy(times) {
    // Reconnect delay increases with attempts, up to 10 seconds max
    return Math.min(times * 500, 10000);
  },
});

connection.on('connect', () => {
  isDisconnectedReported = false;
  console.log('[Redis] Connection established successfully.');
});

connection.on('ready', () => {
  console.log('[Redis] Connection is ready to receive commands.');
});

connection.on('close', () => {
  if (!isDisconnectedReported) {
    console.warn('[Redis] Connection closed. Attempting to reconnect...');
    isDisconnectedReported = true;
  }
});

connection.on('error', (err: any) => {
  const now = Date.now();
  if (now - lastErrorLoggedAt > ERROR_LOG_THROTTLE_MS) {
    console.error(`[Redis Connection Error]: ${err.message || err} (will retry silently)`);
    lastErrorLoggedAt = now;
  }
});

// Custom backoff retry strategy: 1m, 5m, 15m delay
export const customBackoffStrategy = (attemptsMade: number) => {
  const delays = [60000, 300000, 900000]; // in milliseconds
  const delay = delays[attemptsMade - 1];
  return typeof delay === 'number' ? delay : -1; // -1 halts retries, moving job to DLQ
};

export const defaultJobOptions = {
  attempts: 4, // 1 initial attempt + 3 retries (1m, 5m, 15m)
  backoff: {
    type: 'custom',
  },
  removeOnComplete: {
    age: 24 * 3600, // keep completed jobs for 24 hours
    count: 1000,   // limit to max 1000 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // keep failed jobs for 7 days
    count: 5000,       // limit to max 5000 failed jobs
  }
};

export const defaultQueueOptions: QueueOptions = {
  connection: connection as any,
  defaultJobOptions,
};

export const defaultWorkerOptions: WorkerOptions = {
  connection: connection as any,
  concurrency: 5,
  settings: {
    backoffStrategy: (attemptsMade: number, type?: string) => {
      if (type === 'custom') {
        return customBackoffStrategy(attemptsMade);
      }
      return -1;
    }
  },
};
