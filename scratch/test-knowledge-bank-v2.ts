import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

async function main() {
  // Load env variables
  try {
    const envContent = fs.readFileSync('D:/Internship/Ingress Within/.env', 'utf8');
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

  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  // 1. Get a test user
  console.log('Retrieving a test user profile...');
  const { data: profiles, error: profErr } = await db.from('profiles').select('id, phone_number').limit(1);
  if (profErr || !profiles || profiles.length === 0) {
    throw new Error('No user profile found to test with!');
  }
  const testUser = profiles[0];
  console.log(`Using test user: ID=${testUser.id}, Phone=${testUser.phone_number}`);

  // 2. Ensure profile exists and clean it
  console.log('\n--- Test 1: Ensure Profile Exists & Initialize ---');
  let { data: profile, error: pErr } = await db.from('knowledge_profile').select('*').eq('user_id', testUser.id).maybeSingle();
  if (!profile) {
    console.log('Knowledge profile not found, creating default blank profile...');
    const defaultProfile = {
      user_id: testUser.id,
      identity_model: {},
      emotion_model: { visited_emotions: [] },
      vocabulary_model: {},
      pattern_model: {},
      agency_model: {},
      relationship_model: {},
      decision_model: {},
      growth_model: {},
      communication_model: {},
      stress_model: {},
      values_model: {},
      knowledge_version: '2.0'
    };
    const { data: inserted, error: insErr } = await db.from('knowledge_profile').insert(defaultProfile).select('*').single();
    if (insErr) throw insErr;
    profile = inserted;
  }
  console.log('Knowledge profile loaded successfully.');

  // 3. Test Trail Logging
  console.log('\n--- Test 2: Visited Trail Logging (POST /trail & GET /trail) ---');
  const testConcept = 'Loneliness';
  const emotionModel = profile.emotion_model || {};
  const currentVisited = emotionModel.visited_emotions || [];
  
  // Simulate POST
  const updatedVisited = currentVisited.filter((n: string) => n !== testConcept);
  updatedVisited.push(testConcept);
  const updatedEmotionModel = { ...emotionModel, visited_emotions: updatedVisited };
  
  const { error: trailUpdErr } = await db.from('knowledge_profile').update({ emotion_model: updatedEmotionModel }).eq('user_id', testUser.id);
  if (trailUpdErr) throw trailUpdErr;
  console.log(`Logged visit to "${testConcept}" in trail.`);

  // Verify GET
  const { data: verifyProfile, error: verifyErr } = await db.from('knowledge_profile').select('emotion_model').eq('user_id', testUser.id).single();
  if (verifyErr) throw verifyErr;
  const verifyVisited = verifyProfile.emotion_model?.visited_emotions || [];
  if (verifyVisited.includes(testConcept)) {
    console.log('SUCCESS: Visited emotion found in user trail!');
  } else {
    throw new Error('FAILED: Visited emotion missing from user trail.');
  }

  // 4. Test Resonance Logging
  console.log('\n--- Test 3: Resonance Responses (POST /resonance & GET /resonance) ---');
  
  // A. Test Pattern Resonance
  const testPattern = 'Avoidance';
  const testScore = 4;
  const testNote = 'I always leave family meetings when people get loud.';
  const patternModel = profile.pattern_model || {};
  const currentResonance = patternModel.resonance || {};
  const updatedResonance = {
    ...currentResonance,
    [testPattern]: {
      score: testScore,
      notes: testNote,
      updated_at: new Date().toISOString()
    }
  };
  const updatedPatternModel = { ...patternModel, resonance: updatedResonance };
  const { error: patResErr } = await db.from('knowledge_profile').update({ pattern_model: updatedPatternModel }).eq('user_id', testUser.id);
  if (patResErr) throw patResErr;
  console.log(`Saved pattern resonance for "${testPattern}".`);

  // Verify GET Pattern Resonance
  const { data: verifyPatProfile, error: verifyPatErr } = await db.from('knowledge_profile').select('pattern_model').eq('user_id', testUser.id).single();
  if (verifyPatErr) throw verifyPatErr;
  const patResSaved = verifyPatProfile.pattern_model?.resonance?.[testPattern];
  if (patResSaved && patResSaved.score === testScore && patResSaved.notes === testNote) {
    console.log(`SUCCESS: Pattern resonance verified! Score=${patResSaved.score}, Note="${patResSaved.notes}"`);
  } else {
    throw new Error('FAILED: Pattern resonance verification failed.');
  }

  // B. Test Card Resonance
  // Get a card if it exists, otherwise create a mock card
  console.log('Retrieving or creating a test knowledge card...');
  let { data: cards, error: cardsErr } = await db.from('knowledge_cards').select('*').eq('user_id', testUser.id).limit(1);
  if (cardsErr) throw cardsErr;
  
  let card = cards && cards[0];
  if (!card) {
    console.log('No knowledge cards found, inserting a mock card for testing...');
    const mockCard = {
      user_id: testUser.id,
      card_type: 'core_belief',
      title: 'Performance-Conditional Self Worth',
      body: 'You believe you are only loved when you perform well.',
      json_data: {}
    };
    const { data: insertedCard, error: cInsErr } = await db.from('knowledge_cards').insert(mockCard).select('*').single();
    if (cInsErr) throw cInsErr;
    card = insertedCard;
  }

  const cardScore = 5;
  const cardNote = 'This matches exactly how my father reacted to my grade sheets.';
  const updatedJsonData = {
    ...(card.json_data || {}),
    resonance: {
      score: cardScore,
      notes: cardNote,
      updated_at: new Date().toISOString()
    }
  };
  const { error: cardResUpdErr } = await db.from('knowledge_cards').update({ json_data: updatedJsonData }).eq('id', card.id);
  if (cardResUpdErr) throw cardResUpdErr;
  console.log(`Saved card resonance for card "${card.title}".`);

  // Verify GET Card Resonance
  const { data: verifyCard, error: verifyCardErr } = await db.from('knowledge_cards').select('json_data').eq('id', card.id).single();
  if (verifyCardErr) throw verifyCardErr;
  const cardResSaved = (verifyCard.json_data as any)?.resonance;
  if (cardResSaved && cardResSaved.score === cardScore && cardResSaved.notes === cardNote) {
    console.log(`SUCCESS: Card resonance verified! Score=${cardResSaved.score}, Note="${cardResSaved.notes}"`);
  } else {
    throw new Error('FAILED: Card resonance verification failed.');
  }

  // 5. Test Quiz History Logging
  console.log('\n--- Test 4: Quiz Logs (POST /quiz & GET /quiz) ---');
  const quizConcept = 'Sadness';
  const scoreCorrect = 1;
  const scoreTotal = 1;
  
  const currentHistory = verifyProfile.emotion_model?.quiz_history || [];
  const newQuizResult = {
    concept_name: quizConcept,
    score_correct: scoreCorrect,
    score_total: scoreTotal,
    created_at: new Date().toISOString()
  };
  const updatedQuizHistory = [...currentHistory, newQuizResult];
  const updatedQuizEmotionModel = { ...verifyProfile.emotion_model, quiz_history: updatedQuizHistory };
  const { error: quizUpdErr } = await db.from('knowledge_profile').update({ emotion_model: updatedQuizEmotionModel }).eq('user_id', testUser.id);
  if (quizUpdErr) throw quizUpdErr;
  console.log(`Logged quiz result for "${quizConcept}".`);

  // Verify GET Quiz
  const { data: verifyQuizProfile, error: verifyQuizErr } = await db.from('knowledge_profile').select('emotion_model').eq('user_id', testUser.id).single();
  if (verifyQuizErr) throw verifyQuizErr;
  const lastQuiz = verifyQuizProfile.emotion_model?.quiz_history?.slice(-1)[0];
  if (lastQuiz && lastQuiz.concept_name === quizConcept && lastQuiz.score_correct === scoreCorrect) {
    console.log('SUCCESS: Quiz history log verified!');
  } else {
    throw new Error('FAILED: Quiz history verification failed.');
  }

  // 6. Test Synonym / Alias Search Resolution
  console.log('\n--- Test 5: Search Synonym Mapping ---');
  const testQueries = ['stressed', 'sad', 'tense'];
  
  const { DICTIONARY_EMOTIONS, WORD_INDEX } = await import(pathToFileURL(path.join(process.cwd(), 'src/lib/knowledge/dictionaryData.ts')).href);
  
  for (const q of testQueries) {
    const lowerQuery = q.toLowerCase();
    const matchedEmotionNames = new Set<string>();
    
    // Direct matches in dictionary keys
    Object.keys(DICTIONARY_EMOTIONS).forEach(name => {
      if (name.toLowerCase() === lowerQuery || name.toLowerCase().includes(lowerQuery) || lowerQuery.includes(name.toLowerCase())) {
        matchedEmotionNames.add(name);
      }
    });

    // Synonym/Alias mapping check
    Object.entries(WORD_INDEX).forEach(([word, info]: [string, any]) => {
      if (word === lowerQuery || word.includes(lowerQuery) || lowerQuery.includes(word)) {
        if (info.matches) {
          info.matches.forEach((m: string) => matchedEmotionNames.add(m));
        }
      }
    });
    
    console.log(`Query: "${q}" -> Mapped Emotions:`, Array.from(matchedEmotionNames));
    if (q === 'stressed' && (!matchedEmotionNames.has('Anxiety') || !matchedEmotionNames.has('Overwhelm'))) {
      throw new Error('FAILED: "stressed" did not map to Anxiety and Overwhelm.');
    }
    if (q === 'sad' && !matchedEmotionNames.has('Sadness')) {
      throw new Error('FAILED: "sad" did not map to Sadness.');
    }
  }
  console.log('SUCCESS: Search synonym/alias mapping works flawlessly!');

  console.log('\n====================================');
  console.log('ALL KNOWLEDGE BANK V2 TESTS PASSED!');
  console.log('====================================');
}

main().catch(err => {
  console.error('\nE2E Verification Failed:', err);
  process.exit(1);
});
