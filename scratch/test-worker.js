// scratch/test-worker.js
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      if (key && val) {
        process.env[key] = val;
      }
    }
  });
}

import { processEntryScoring } from '../src/lib/queue/workers/entryScoringWorker';

async function run() {
  const entryId = '2365ce5d-5460-4299-a9ce-6d5548535d0d';
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
  
  try {
    console.log(`Starting processEntryScoring for entry ${entryId}...`);
    await processEntryScoring({ entry_id: entryId, user_id: userId });
    console.log('Worker completed successfully!');
  } catch (error) {
    console.error('Worker failed with error:', error);
  }
}

run();
