import fs from 'fs';
import path from 'path';

// 1. Manually load environment variables from .env
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim();
      if (key && val) {
        process.env[key.trim()] = val;
      }
    }
    console.log('[Test Setup] Loaded environment variables from .env successfully.');
  } else {
    console.warn('[Test Setup] .env file not found.');
  }
} catch (err) {
  console.warn('[Test Setup] Could not load .env file:', err);
}

// 2. Import the factory and provider singleton
import { getAIProvider, aiProvider } from '../src/lib/ai';

async function runTests() {
  console.log('\n==================================================');
  console.log(`ACTIVE AI_PROVIDER: ${process.env.AI_PROVIDER || 'groq (default)'}`);
  console.log('==================================================\n');

  const provider = aiProvider;

  // Verify that the factory initialized the correct provider class
  console.log(`[Verification] Provider instance class: ${provider.constructor.name}\n`);

  const mockJournalEntry = `I am feeling very tired and exhausted today. The workload at my job is extremely heavy, and I feel like I'm just avoiding talking to my boss about it because I'm worried it will lead to conflict. I tell everyone I'm fine, but inside I feel depleted.`;

  // Test Case 1: scoreEntry
  console.log('--- 1. Testing scoreEntry() ---');
  try {
    const scoreResult = await provider.scoreEntry(mockJournalEntry);
    console.log('Success! Result:\n', JSON.stringify(scoreResult, null, 2));
  } catch (err: any) {
    console.log(`Caught expected config warning or API error: ${err.message}\n`);
  }

  // Test Case 2: generateReflection
  console.log('--- 2. Testing generateReflection() ---');
  try {
    const reflectionResult = await provider.generateReflection(mockJournalEntry);
    console.log('Success! Result:\n', JSON.stringify(reflectionResult, null, 2));
  } catch (err: any) {
    console.log(`Caught expected config warning or API error: ${err.message}\n`);
  }

  // Test Case 3: generateWeeklySummary
  console.log('--- 3. Testing generateWeeklySummary() ---');
  try {
    const weeklyResult = await provider.generateWeeklySummary([
      { content: mockJournalEntry, created_at: '2026-06-10T12:00:00Z' },
      { content: 'Another busy day, felt frustrated with meetings and ended up saying everything was fine.', created_at: '2026-06-11T12:00:00Z' },
      { content: 'Had a decent rest, but still feeling fatigued and avoided making a decision.', created_at: '2026-06-12T12:00:00Z' }
    ]);
    console.log('Success! Result:\n', JSON.stringify(weeklyResult, null, 2));
  } catch (err: any) {
    console.log(`Caught expected config warning or API error: ${err.message}\n`);
  }

  // Test Case 4: generateMonthlyReport
  console.log('--- 4. Testing generateMonthlyReport() ---');
  try {
    const monthlyResult = await provider.generateMonthlyReport([
      { content: mockJournalEntry, created_at: '2026-06-01T12:00:00Z' },
      { content: 'Felt depleted but kept quiet to avoid boss arguments.', created_at: '2026-06-15T12:00:00Z' }
    ]);
    console.log('Success! Result:\n', JSON.stringify(monthlyResult, null, 2));
  } catch (err: any) {
    console.log(`Caught expected config warning or API error: ${err.message}\n`);
  }

  // Test Case 5: generateOceanSummary
  console.log('--- 5. Testing generateOceanSummary() ---');
  try {
    const oceanResult = await provider.generateOceanSummary([
      { content: mockJournalEntry, created_at: '2026-06-01T12:00:00Z' }
    ]);
    console.log('Success! Result:\n', JSON.stringify(oceanResult, null, 2));
  } catch (err: any) {
    console.log(`Caught expected config warning or API error: ${err.message}\n`);
  }

  // Test Case 6: generateExerciseInsight
  console.log('--- 6. Testing generateExerciseInsight() ---');
  try {
    const insightResult = await provider.generateExerciseInsight(
      'Work Pressure',
      'If I speak up about the workload, my boss will fire me or hate me.',
      'If I speak up constructively, we can prioritize the tasks together, which helps the company and my stress level.'
    );
    console.log('Success! Result:\n', JSON.stringify(insightResult, null, 2));
  } catch (err: any) {
    console.log(`Caught expected config warning or API error: ${err.message}\n`);
  }

  console.log('==================================================');
  console.log('Test Run Completed.');
  console.log('==================================================\n');
}

runTests().catch(console.error);
