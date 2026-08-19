import { ClaudeProvider } from '../src/lib/ai/providers/claude';
import { GroqProvider } from '../src/lib/ai/providers/GroqProvider';
import { FallbackProvider } from '../src/lib/ai/providers/FallbackProvider';
import { AIProvider, ReflectionResponse, ClarityScoreResponse } from '../src/lib/ai/types';

async function runTests() {
  console.log('====================================================');
  console.log('CLAUDE + GROQ FALLBACK ARCHITECTURE VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 5;

  // =========================================================================
  // TEST 1: Claude succeeds → Claude result returned → Groq is NOT called
  // =========================================================================
  console.log('--- TEST 1: Claude Succeeds (Groq NOT called) ---');
  let groqCalledInTest1 = false;

  class MockWorkingClaude extends ClaudeProvider {
    async scoreEntry(content: string): Promise<ClarityScoreResponse> {
      this.lastRawResponse = '{"clarityScore": 88, "sentiment": "grounded", "stressIndicators": []}';
      return { clarityScore: 88, sentiment: 'grounded', stressIndicators: [] };
    }
  }

  class MockSpyGroq extends GroqProvider {
    async scoreEntry(content: string): Promise<ClarityScoreResponse> {
      groqCalledInTest1 = true;
      return { clarityScore: 50, sentiment: 'fallback', stressIndicators: [] };
    }
  }

  const provider1 = new FallbackProvider(new MockWorkingClaude(), new MockSpyGroq());
  const res1 = await provider1.scoreEntry('I felt clear and resolved today.');

  console.log('Result 1:', res1);
  console.log('Provider used:', provider1.lastProviderUsed);
  console.log('Fallback used:', provider1.lastFallbackUsed);
  console.log('Groq was called:', groqCalledInTest1);

  if (
    res1.clarityScore === 88 &&
    provider1.lastProviderUsed === 'claude' &&
    provider1.lastFallbackUsed === false &&
    !groqCalledInTest1
  ) {
    console.log('✅ TEST 1 PASSED: Claude succeeded, Groq was never called.\n');
    passedTests++;
  } else {
    console.error('❌ TEST 1 FAILED!\n');
  }

  // =========================================================================
  // TEST 2: Claude simulated failure → Groq is called automatically → Groq result returned
  // =========================================================================
  console.log('--- TEST 2: Claude Fails (Network/API Error) → Groq Fallback Succeeds ---');
  let groqCalledInTest2 = false;

  class MockFailingClaude extends ClaudeProvider {
    async scoreEntry(content: string): Promise<ClarityScoreResponse> {
      throw new Error('Anthropic API Rate Limit (429): Rate limit exceeded. Try again in 10s.');
    }
  }

  class MockWorkingGroq extends GroqProvider {
    async scoreEntry(content: string): Promise<ClarityScoreResponse> {
      groqCalledInTest2 = true;
      this.lastRawResponse = '{"clarityScore": 72, "sentiment": "calm", "stressIndicators": ["work"]}';
      return { clarityScore: 72, sentiment: 'calm', stressIndicators: ['work'] };
    }
  }

  const provider2 = new FallbackProvider(new MockFailingClaude(), new MockWorkingGroq());
  const res2 = await provider2.scoreEntry('Today was a busy day.');

  console.log('Result 2:', res2);
  console.log('Provider used:', provider2.lastProviderUsed);
  console.log('Fallback used:', provider2.lastFallbackUsed);
  console.log('Primary provider error:', provider2.lastPrimaryError);
  console.log('Groq was called:', groqCalledInTest2);

  if (
    res2.clarityScore === 72 &&
    provider2.lastProviderUsed === 'groq' &&
    provider2.lastFallbackUsed === true &&
    groqCalledInTest2
  ) {
    console.log('✅ TEST 2 PASSED: Claude failed, Groq was called and returned valid result.\n');
    passedTests++;
  } else {
    console.error('❌ TEST 2 FAILED!\n');
  }

  // =========================================================================
  // TEST 3: Claude malformed response → validation fails → Groq fallback is attempted
  // =========================================================================
  console.log('--- TEST 3: Claude Malformed Structured Output → Groq Fallback Succeeds ---');
  let groqCalledInTest3 = false;

  class MockMalformedClaude extends ClaudeProvider {
    async generateReflection(content: string): Promise<ReflectionResponse> {
      // Missing reflection string / empty object
      return {
        classification: 'Open',
        reflection: '', // empty!
        closing_question: '',
        confidence: 'high',
        themes: [],
        processing_notes: 'malformed'
      } as any;
    }
  }

  class MockValidGroqReflection extends GroqProvider {
    async generateReflection(content: string): Promise<ReflectionResponse> {
      groqCalledInTest3 = true;
      return {
        classification: 'Open',
        reflection: 'You noticed the pressure building before addressing it directly.',
        closing_nudge: 'Take care tonight.',
        closing_question: 'What would happen if you named it earlier?',
        confidence: 'high',
        themes: ['Avoidance', 'Clarity'],
        vocabulary: ['pressure', 'building'],
        processing_notes: 'Generated via Groq fallback'
      };
    }
  }

  const provider3 = new FallbackProvider(new MockMalformedClaude(), new MockValidGroqReflection());
  const res3 = await provider3.generateReflection('I felt pressure at work.');

  console.log('Result 3:', res3.reflection);
  console.log('Provider used:', provider3.lastProviderUsed);
  console.log('Fallback used:', provider3.lastFallbackUsed);

  if (
    res3.reflection.length > 0 &&
    provider3.lastProviderUsed === 'groq' &&
    provider3.lastFallbackUsed === true &&
    groqCalledInTest3
  ) {
    console.log('✅ TEST 3 PASSED: Claude returned malformed response, schema validation caught it, Groq fallback succeeded.\n');
    passedTests++;
  } else {
    console.error('❌ TEST 3 FAILED!\n');
  }

  // =========================================================================
  // TEST 4: Both Claude and Groq fail → controlled error returned → no DB write
  // =========================================================================
  console.log('--- TEST 4: Both Claude and Groq Fail → Controlled Error Thrown ---');
  class MockFailingClaude4 extends ClaudeProvider {
    async scoreEntry(content: string): Promise<ClarityScoreResponse> {
      throw new Error('Claude 503 Service Unavailable');
    }
  }

  class MockFailingGroq4 extends GroqProvider {
    async scoreEntry(content: string): Promise<ClarityScoreResponse> {
      throw new Error('Groq 500 Internal Server Error');
    }
  }

  const provider4 = new FallbackProvider(new MockFailingClaude4(), new MockFailingGroq4());
  let caughtError: any = null;

  try {
    await provider4.scoreEntry('Some entry');
  } catch (err: any) {
    caughtError = err;
  }

  console.log('Caught Error:', caughtError?.message);

  if (
    caughtError &&
    caughtError.message.includes('Primary provider (Claude) failed') &&
    caughtError.message.includes('Fallback provider (Groq) also failed')
  ) {
    console.log('✅ TEST 4 PASSED: Controlled error thrown without crashing or partial writes.\n');
    passedTests++;
  } else {
    console.error('❌ TEST 4 FAILED!\n');
  }

  // =========================================================================
  // TEST 5: Verify only ONE final result is returned (No duplicate execution writes)
  // =========================================================================
  console.log('--- TEST 5: Verify Single Result Guarantee & Trace Metadata ---');
  let claudeCallCount = 0;
  let groqCallCount = 0;

  class MockCountClaude extends ClaudeProvider {
    async generatePersonalitySummary(scores: any): Promise<string> {
      claudeCallCount++;
      return 'You tend to process thoughts internally before speaking. This space is designed for exactly that.';
    }
  }

  class MockCountGroq extends GroqProvider {
    async generatePersonalitySummary(scores: any): Promise<string> {
      groqCallCount++;
      return 'Groq personality summary';
    }
  }

  const provider5 = new FallbackProvider(new MockCountClaude(), new MockCountGroq());
  const res5 = await provider5.generatePersonalitySummary({
    openness: 70,
    conscientiousness: 60,
    extraversion: 40,
    agreeableness: 80,
    neuroticism: 50
  });

  console.log('Summary Result:', res5);
  console.log('Claude Call Count:', claudeCallCount);
  console.log('Groq Call Count:', groqCallCount);

  if (
    typeof res5 === 'string' &&
    claudeCallCount === 1 &&
    groqCallCount === 0 &&
    provider5.lastProviderUsed === 'claude'
  ) {
    console.log('✅ TEST 5 PASSED: Exactly one provider executed and one result returned.\n');
    passedTests++;
  } else {
    console.error('❌ TEST 5 FAILED!\n');
  }

  console.log('====================================================');
  console.log(`SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================');
}

runTests().catch(console.error);
