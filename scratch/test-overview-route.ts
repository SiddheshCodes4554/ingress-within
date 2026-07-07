import './load-env';
import { VocabularyIntelligenceService } from '../src/lib/vocab/vocabIntelligenceService';

async function run() {
  const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
  console.log(`Calling getVocabularyOverview for user ${userId}...`);
  const data = await VocabularyIntelligenceService.getVocabularyOverview(userId, false);
  console.log('Result:', JSON.stringify(data, null, 2));
}

run();
