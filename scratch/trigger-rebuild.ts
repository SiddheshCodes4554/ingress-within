import './load-env';
import { rebuildUserVocabulary } from '../src/lib/vocab/rebuildService';

const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

async function main() {
  console.log(`[Rebuild Script] Triggering background vocabulary rebuild for user ${userId}...`);
  rebuildUserVocabulary(userId)
    .then((res) => {
      console.log(`[Rebuild Script] Rebuild completed successfully.`, res);
    })
    .catch((err) => {
      console.error(`[Rebuild Script] Rebuild failed:`, err);
    });
}

main();
