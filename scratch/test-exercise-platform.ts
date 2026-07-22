import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// Load .env file
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
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
      process.env[key] = val;
    }
  });
} catch (e: any) {
  console.error('Could not read .env file:', e.message);
}

const testUser = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
const testCycle = '69d4b73b-f212-47be-a2d4-5ab965e12829';

// Setup mock fetch framework
const originalFetch = globalThis.fetch;
let mockFetchHandler: ((url: string, init?: any) => Promise<any>) | null = null;

globalThis.fetch = function (url: string | URL, init?: any) {
  const urlStr = url.toString();
  const isAI = urlStr.includes('generativelanguage.googleapis.com') ||
               urlStr.includes('api.groq.com') ||
               urlStr.includes('api.anthropic.com');
  if (isAI && mockFetchHandler) {
    return mockFetchHandler(urlStr, init);
  }
  return originalFetch(url, init);
} as any;

async function main() {
  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  const registryPath = pathToFileURL(path.join(process.cwd(), 'src/lib/exercises/exercisePromptRegistry.ts')).href;
  const { ExercisePromptRegistry } = await import(registryPath);

  const workerPath = pathToFileURL(path.join(process.cwd(), 'src/lib/exercises/exerciseAnalysisWorker.ts')).href;
  const { ExerciseAnalysisWorker } = await import(workerPath);

  const lifecyclePath = pathToFileURL(path.join(process.cwd(), 'src/lib/exercises/exerciseLifecycleManager.ts')).href;
  const { ExerciseLifecycleManager } = await import(lifecyclePath);

  const enginePath = pathToFileURL(path.join(process.cwd(), 'src/lib/exercises/exerciseEngine.ts')).href;
  const { ExerciseEngine } = await import(enginePath);

  console.log('=== Cleanup Old Test Instances ===');
  const { data: oldInsts } = await db
    .from('exercise_instances')
    .select('id')
    .eq('user_id', testUser);

  if (oldInsts && oldInsts.length > 0) {
    const ids = oldInsts.map((i: any) => i.id);
    await db.from('exercise_instances').delete().in('id', ids);
    console.log(`Pruned ${ids.length} old test instances.`);
  }

  // 1. Version Migration & Prompt Registry Check
  console.log('\n=== 1. Testing Version Migration & Prompt Registry ===');
  const configV1 = ExercisePromptRegistry.getPromptConfig('exercise_0', 'v1');
  const configV2 = ExercisePromptRegistry.getPromptConfig('exercise_0', 'v2');

  console.log(`v1 Config: Provider=${configV1.provider}, Model=${configV1.model}`);
  console.log(`v2 Config: Provider=${configV2.provider}, Model=${configV2.model}`);

  if (configV1.provider !== 'gemini' || configV2.provider !== 'groq') {
    console.error('❌ FAILED: Prompt Registry did not load expected versions.');
    process.exit(1);
  }
  console.log('✅ Version migration & prompt registry validated.');

  // Create base instance for testing
  const { data: testInst, error: createErr } = await db
    .from('exercise_instances')
    .insert({
      user_id: testUser,
      exercise_id: 'exercise_0',
      cycle_id: testCycle,
      status: 'queued',
      locked: false,
      available: true,
      started: true,
      completed: true
    })
    .select()
    .single();

  if (createErr || !testInst) {
    console.error('❌ Failed to insert test instance:', createErr?.message);
    process.exit(1);
  }

  // 2. Insert mock answers for dimension and reverse score math checks
  // O: q1=5, q2=5, q13=5 (rev: 6-5=1) -> avg = 3.7
  // C: q3=4, q4=4, q14=4 (rev: 6-4=2) -> avg = 3.3
  // E: q5=3, q6=3, q15=3 (rev: 6-3=3) -> avg = 3.0
  // A: q7=2, q8=2, q9=2  (rev: 6-2=4) -> avg = 2.7
  // N: q10=1, q11=1, q12=1, q16=1 (rev: 6-1=5) -> avg = 2.0
  console.log('\n=== 2. Inserting OCEAN responses for scoring validation ===');
  const responses = [
    { question_id: 'q1', response: 5 },
    { question_id: 'q2', response: 5 },
    { question_id: 'q3', response: 4 },
    { question_id: 'q4', response: 4 },
    { question_id: 'q5', response: 3 },
    { question_id: 'q6', response: 3 },
    { question_id: 'q7', response: 2 },
    { question_id: 'q8', response: 2 },
    { question_id: 'q10', response: 1 },
    { question_id: 'q11', response: 1 },
    { question_id: 'q12', response: 1 },
    { question_id: 'q13', response: 5 }, // rev
    { question_id: 'q14', response: 4 }, // rev
    { question_id: 'q15', response: 3 }, // rev
    { question_id: 'q9', response: 2 },  // rev
    { question_id: 'q16', response: 1 }  // rev
  ].map((r, idx) => ({
    instance_id: testInst.id,
    user_id: testUser,
    question_id: r.question_id,
    step_id: `step_${idx + 1}`,
    response: r.response
  }));

  await db.from('exercise_responses').insert(responses);

  // Setup AI Mock call
  const mockValidResponse = {
    analysis: "You tend to seek out variety and novel concepts, but maintain a grounded approach. Conflict represents a challenge you quietly resolve. This space is designed for exactly that.",
    scores: { clarity: 6, intensity: 8, reactivity: 7 },
    branch: "emotional_acceptance",
    lens: "CBT Reframing",
    gap_score: 3.2,
    summary: "This space is designed for exactly that."
  };

  mockFetchHandler = async (url, init) => {
    return {
      status: 200,
      ok: true,
      json: async () => ({
        candidates: [{
          content: { parts: [{ text: JSON.stringify(mockValidResponse) }] }
        }]
      })
    };
  };

  console.log('\n=== 3. Executing AI Worker for OCEAN evaluation ===');
  await ExerciseAnalysisWorker.execute({
    instance_id: testInst.id,
    exercise_id: 'exercise_0',
    user_id: testUser,
    cycle_id: testCycle
  });

  // Verify scores inside users table
  const { data: userRec } = await db
    .from('users')
    .select('ocean_openness, ocean_conscientiousness, ocean_extraversion, ocean_agreeableness, ocean_neuroticism, personality_summary_text')
    .eq('id', testUser)
    .single();

  console.log('--- Calculated scores on users table ---');
  console.log(`Openness: ${userRec?.ocean_openness} (expected 3.7)`);
  console.log(`Conscientiousness: ${userRec?.ocean_conscientiousness} (expected 3.3)`);
  console.log(`Extraversion: ${userRec?.ocean_extraversion} (expected 3.0)`);
  console.log(`Agreeableness: ${userRec?.ocean_agreeableness} (expected 2.7)`);
  console.log(`Neuroticism: ${userRec?.ocean_neuroticism} (expected 2.0)`);
  console.log(`Summary Text: "${userRec?.personality_summary_text}"`);

  if (
    Number(userRec?.ocean_openness) !== 3.7 ||
    Number(userRec?.ocean_conscientiousness) !== 3.3 ||
    Number(userRec?.ocean_extraversion) !== 3.0 ||
    Number(userRec?.ocean_agreeableness) !== 2.7 ||
    Number(userRec?.ocean_neuroticism) !== 2.0
  ) {
    console.error('❌ FAILED: OCEAN scoring calculations or reverse-scoring math are incorrect!');
    process.exit(1);
  }
  console.log('✅ OCEAN scoring and reverse-scoring math validated successfully!');

  // Verify profiles onboarding flags
  const { data: profileRec } = await db
    .from('profiles')
    .select('assessment_completed, onboarding_completed')
    .eq('id', testUser)
    .single();

  console.log(`profile.assessment_completed = ${profileRec?.assessment_completed}`);
  console.log(`profile.onboarding_completed = ${profileRec?.onboarding_completed}`);

  if (!profileRec?.assessment_completed || !profileRec?.onboarding_completed) {
    console.error('❌ FAILED: Onboarding completions flags were not set to true!');
    process.exit(1);
  }
  console.log('✅ Onboarding flags flipped successfully!');

  // Cleanup
  await db.from('exercise_instances').delete().eq('id', testInst.id);
  console.log('\n=== SUCCESS: All OCEAN Assessment Phase 5 tests passed! ===');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
