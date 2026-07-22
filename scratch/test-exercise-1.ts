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

// Setup mock fetch framework to only intercept LLM calls
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

  const unlockPath = pathToFileURL(path.join(process.cwd(), 'src/lib/exercises/exerciseUnlockService.ts')).href;
  const { ExerciseUnlockService } = await import(unlockPath);

  const generatorPath = pathToFileURL(path.join(process.cwd(), 'src/lib/exercises/wordAssociationGenerator.ts')).href;
  const { WordAssociationGenerator } = await import(generatorPath);

  const progressPath = pathToFileURL(path.join(process.cwd(), 'src/lib/exercises/exerciseProgressService.ts')).href;
  const { ExerciseProgressService } = await import(progressPath);

  const workerPath = pathToFileURL(path.join(process.cwd(), 'src/lib/exercises/exerciseAnalysisWorker.ts')).href;
  const { ExerciseAnalysisWorker } = await import(workerPath);

  console.log('=== Cleanup Old Exercise 1 Test Data ===');
  const { data: oldInsts } = await db
    .from('exercise_instances')
    .select('id')
    .eq('user_id', testUser)
    .eq('exercise_id', 'exercise_1');

  if (oldInsts && oldInsts.length > 0) {
    const ids = oldInsts.map((i: any) => i.id);
    await db.from('exercise_instances').delete().in('id', ids);
    console.log(`Pruned ${ids.length} old exercise_1 instances.`);
  }

  // 1. Testing Unlock Prerequisites
  console.log('\n=== 1. Testing Unlock Prerequisites ===');
  
  // Set up mock conditions where prerequisites are missing
  console.log('Simulating missing prerequisites (Exercise 0 incomplete)...');
  await db.from('exercise_instances').update({ status: 'started', completed: false }).eq('user_id', testUser).eq('exercise_id', 'exercise_0');

  // Trigger unlock check
  const newlyUnlockedEmpty = await ExerciseUnlockService.processUnlocks(testUser, testCycle, 'UTC', 10);
  console.log('Newly unlocked count (prereqs missing):', newlyUnlockedEmpty.length);
  if (newlyUnlockedEmpty.some(i => i.exercise_id === 'exercise_1')) {
    console.error('❌ FAILED: exercise_1 unlocked without completed Exercise 0!');
    process.exit(1);
  }
  console.log('✅ Correctly kept locked when Exercise 0 is incomplete.');

  // Set all prerequisites to valid values
  console.log('\nRestoring prerequisites to valid states...');
  // Complete Exercise 0
  await db.from('exercise_instances').update({ status: 'finished', completed: true }).eq('user_id', testUser).eq('exercise_id', 'exercise_0');

  // Ensure user has vocab snapshot
  const { data: existingVocab } = await db.from('vocab_snapshots').select('id').eq('user_id', testUser).limit(1);
  if (!existingVocab || existingVocab.length === 0) {
    await db.from('vocab_snapshots').insert({ user_id: testUser, cycle_id: testCycle, snapshot_data: {} });
  }

  // Ensure user has knowledge snapshot
  const { data: existingKnowledge } = await db.from('knowledge_snapshots').select('id').eq('user_id', testUser).limit(1);
  if (!existingKnowledge || existingKnowledge.length === 0) {
    await db.from('knowledge_snapshots').insert({ user_id: testUser, cycle_id: testCycle, snapshot_data: {} });
  }

  // Verify unlock succeeds now
  const newlyUnlockedValid = await ExerciseUnlockService.processUnlocks(testUser, testCycle, 'UTC', 10);
  const ex1Instance = newlyUnlockedValid.find(i => i.exercise_id === 'exercise_1');
  if (!ex1Instance) {
    // If already exists in DB, fetch it
    const { data: existingEx1 } = await db
      .from('exercise_instances')
      .select('*')
      .eq('user_id', testUser)
      .eq('exercise_id', 'exercise_1')
      .maybeSingle();

    if (!existingEx1) {
      console.error('❌ FAILED: exercise_1 unlock failed to trigger even when all prerequisites are met!');
      process.exit(1);
    }
    console.log('✅ exercise_1 already unlocked in database.');
  } else {
    console.log('✅ exercise_1 successfully unlocked! Instance ID:', ex1Instance.id);
  }

  const activeInstance = ex1Instance || (await db
    .from('exercise_instances')
    .select('*')
    .eq('user_id', testUser)
    .eq('exercise_id', 'exercise_1')
    .single()).data;

  // 2. Testing Stimulus Generation
  console.log('\n=== 2. Testing Stimulus Generation ===');
  const genResult = await WordAssociationGenerator.generate(testUser);
  console.log('Personalised words:', genResult.personalised);
  console.log('Stimulus sequence (12 words):', genResult.sequence);
  
  if (genResult.sequence.length !== 12) {
    console.error('❌ FAILED: Stimulus sequence is not exactly 12 words!');
    process.exit(1);
  }
  console.log('✅ Dynamic stimulus generation passed.');

  // 3. Testing Resume & Caching
  console.log('\n=== 3. Testing Resume & Caching ===');
  // First resume call triggers generation and db caching of the stimulus list
  const resume1 = await ExerciseProgressService.resumeExercise(testUser, activeInstance.id);
  console.log('Resume 1 Stimulus List:', resume1.stimulusList);
  
  if (!resume1.stimulusList || resume1.stimulusList.length !== 12) {
    console.error('❌ FAILED: Resume 1 stimulus list is missing or invalid!');
    process.exit(1);
  }

  // Second resume call should load the identical list from DB cache without regeneration
  const resume2 = await ExerciseProgressService.resumeExercise(testUser, activeInstance.id);
  console.log('Resume 2 Stimulus List:', resume2.stimulusList);

  const match = JSON.stringify(resume1.stimulusList) === JSON.stringify(resume2.stimulusList);
  if (!match) {
    console.error('❌ FAILED: Stimulus list was regenerated on resume!');
    process.exit(1);
  }
  console.log('✅ Caching and persistence validated.');

  // 4. Testing Autosave
  console.log('\n=== 4. Testing Autosave ===');
  await ExerciseProgressService.saveProgress(testUser, activeInstance.id, 'q_1', 'step_1', 'home-sweet-home');
  
  const resumeAfterSave = await ExerciseProgressService.resumeExercise(testUser, activeInstance.id);
  const q1Response = resumeAfterSave.responses.find(r => r.question_id === 'q_1');
  console.log('Autosaved response for q_1:', q1Response?.response);
  if (q1Response?.response !== 'home-sweet-home') {
    console.error('❌ FAILED: Autosave response verification failed.');
    process.exit(1);
  }
  console.log('✅ Response autosave and recovery validated.');

  // 5. Testing Call 2 AI Analysis Output Parsing & Fallbacks
  console.log('\n=== 5. Testing Call 2 AI Analysis & Fallbacks ===');
  
  // Set up mock inputs for all 12 answers
  const mockResponses = resume2.stimulusList.map((word, idx) => ({
    instance_id: activeInstance.id,
    user_id: testUser,
    question_id: `q_${idx + 1}`,
    step_id: `step_${idx + 1}`,
    response: `${word}-response`
  }));
  
  // Clean old check-responses and write complete answers set
  await db.from('exercise_responses').delete().eq('instance_id', activeInstance.id);
  await db.from('exercise_responses').insert([
    {
      instance_id: activeInstance.id,
      user_id: testUser,
      question_id: '__stimulus_list',
      step_id: '__stimulus_list',
      response: resume2.stimulusList
    },
    ...mockResponses
  ]);

  // Set up valid mixed text and JSON mock from LLM
  const mockAIProse = "HOME got warm family context, but WRONG got intense self-criticism. The most interesting is SAFE which got isolation, suggesting relational proximity carries threat indicators.";
  const mockAIJson = {
    dominant_register: "withdrawal",
    emotional_register_gap: "significant_gap",
    suppression_flag: true,
    revealing_pairs: [
      { word: "SAFE", response: "isolation", note: "Shows safety is modeled as avoidance of others." }
    ]
  };
  const mockLLMOutput = `${mockAIProse}\n\n${JSON.stringify(mockAIJson)}`;

  mockFetchHandler = async (url, init) => {
    return {
      status: 200,
      ok: true,
      json: async () => ({
        candidates: [{
          content: { parts: [{ text: mockLLMOutput }] }
        }]
      })
    };
  };

  // Run worker execution
  await ExerciseAnalysisWorker.execute({
    instance_id: activeInstance.id,
    exercise_id: 'exercise_1',
    user_id: testUser,
    cycle_id: testCycle
  });

  // Query analysis results
  const { data: resultRec } = await db
    .from('exercise_results')
    .select('*')
    .eq('instance_id', activeInstance.id)
    .single();

  console.log('--- Extracted result fields ---');
  console.log('Analysis Text:', resultRec?.analysis);
  console.log('Summary:', resultRec?.summary);
  console.log('JSON content (raw_json):', resultRec?.raw_json);

  if (
    resultRec?.analysis !== mockAIProse ||
    resultRec?.raw_json.dominant_register !== "withdrawal" ||
    resultRec?.raw_json.suppression_flag !== true
  ) {
    console.error('❌ FAILED: Call 2 output parsing failed to extract narrative or JSON fields correctly.');
    process.exit(1);
  }
  console.log('✅ Call 2 parser extracted prose and JSON structure successfully!');

  // Cleanup
  await db.from('exercise_instances').delete().eq('id', activeInstance.id);
  console.log('\n=== SUCCESS: All Exercise 1 Word Association tests passed! ===');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
