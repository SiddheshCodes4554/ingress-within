import './load-env';
import { processEntryScoring } from '../src/lib/queue/workers/entryScoringWorker';

async function main() {
  const entryId = 'c86dea12-9ac0-4942-887a-ab3a740e656c';
  console.log(`Running full entry scoring and reflection pipeline for entry ${entryId}...`);
  await processEntryScoring({
    entry_id: entryId,
    user_id: 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7'
  });
  console.log("Pipeline finished execution.");
}

main().catch(console.error);
