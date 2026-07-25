import './load-env';
import { workerRegistry } from './workerRegistry';
import { queueRegistry } from './registry';
import { connection } from './config';
import { printQueueStatus } from './monitoring';

console.log('[Worker Daemon] Starting Ingress Within background processing worker registry...');

// Start all workers
workerRegistry.startAll();

// Print status every 30 seconds
const statusInterval = setInterval(async () => {
  await printQueueStatus();
}, 30000);

// Initial status report
printQueueStatus().catch(err => {
  console.error('[Worker Daemon] Error reporting initial status:', err);
});

// Graceful shutdown helper
async function shutdown(signal: string) {
  console.log(`[Worker Daemon] Received ${signal}. Initiating graceful shutdown...`);
  clearInterval(statusInterval);

  try {
    // 1. Close all workers
    await workerRegistry.stopAll();
    // 2. Close all queue registry connections
    await queueRegistry.closeAll();
    // 3. Close the shared Redis client connection
    await connection.quit();
    console.log('[Worker Daemon] Graceful shutdown completed. Exiting.');
    process.exit(0);
  } catch (err) {
    console.error('[Worker Daemon] Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
