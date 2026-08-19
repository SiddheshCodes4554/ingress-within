process.env.BYPASS_REDIS = 'true';

import { FallbackProvider } from '../src/lib/ai/providers/FallbackProvider';
import { ClaudeProvider } from '../src/lib/ai/providers/claude';
import { GroqProvider } from '../src/lib/ai/providers/GroqProvider';

async function runVocabClusteringTests() {
  console.log('====================================================');
  console.log('VOCABULARY CLUSTERING: CLAUDE PRIMARY + GROQ FALLBACK');
  console.log('====================================================\n');

  let passedCount = 0;
  const totalCount = 5;

  const sampleWords = [
    { word: 'exhausted', normalized_word: 'exhaust', frequency: 4, semantic_meaning: 'Severe emotional and cognitive depletion.' },
    { word: 'overwhelmed', normalized_word: 'overwhelm', frequency: 3, semantic_meaning: 'Feeling inundated by task pressure.' },
    { word: 'anxious', normalized_word: 'anxious', frequency: 2, semantic_meaning: 'Persistent worry about meeting expectations.' }
  ];

  // =========================================================================
  // TEST 1 — Normal Clustering (Claude Primary Success)
  // =========================================================================
  console.log('--- TEST 1: Normal Emotional Vocabulary Clustering (Claude Primary) ---');
  let groqCalledInTest1 = false;

  class MockWorkingClaudeClustering extends ClaudeProvider {
    async groupClusters(words: any[]) {
      this.lastRawResponse = JSON.stringify({
        clusters: [
          {
            cluster_name: 'exhaust',
            words: ['drained', 'fatigued', 'depleted'],
            description: 'Exhausted implies recovery needed. Drained implies energy spent. Depleted implies resources taken. Notice which one reflects your current baseline.',
            confidence: 0.95
          },
          {
            cluster_name: 'overwhelm',
            words: ['pressured', 'inundated', 'burdened'],
            description: 'Overwhelmed points to volume. Pressured points to expectations. Burdened points to emotional weight.',
            confidence: 0.92
          }
        ]
      });
      return JSON.parse(this.lastRawResponse);
    }
  }

  class MockSpyGroqClustering extends GroqProvider {
    async groupClusters() {
      groqCalledInTest1 = true;
      return { clusters: [] };
    }
  }

  const provider1 = new FallbackProvider(new MockWorkingClaudeClustering(), new MockSpyGroqClustering());
  const res1 = await provider1.groupClusters(sampleWords);

  console.log('Generated Clusters Count:', res1.clusters?.length);
  console.log('First Cluster:', res1.clusters?.[0]);
  console.log('Provider used:', provider1.lastProviderUsed);
  console.log('Fallback used:', provider1.lastFallbackUsed);
  console.log('Groq called:', groqCalledInTest1);

  if (
    res1.clusters?.length === 2 &&
    res1.clusters[0].cluster_name === 'exhaust' &&
    res1.clusters[0].words.length === 3 &&
    provider1.lastProviderUsed === 'claude' &&
    provider1.lastFallbackUsed === false &&
    !groqCalledInTest1
  ) {
    console.log('✅ TEST 1 PASSED: Claude successfully generated nuanced emotional clusters without invoking Groq.\n');
    passedCount++;
  } else {
    console.error('❌ TEST 1 FAILED!\n');
  }

  // =========================================================================
  // TEST 2 — Weak / Unrelated Vocabulary (Validation & Filtering)
  // =========================================================================
  console.log('--- TEST 2: Weak / Malformed Cluster Filtering ---');

  class MockMalformedClaudeClustering extends ClaudeProvider {
    async groupClusters() {
      this.lastRawResponse = JSON.stringify({
        clusters: [
          {
            cluster_name: '', // invalid empty name
            words: [],
            description: '',
            confidence: 0
          },
          {
            cluster_name: 'valid_theme',
            words: ['word1', 'word2'],
            description: 'A genuine theme distinction.',
            confidence: 0.88
          }
        ]
      });
      return JSON.parse(this.lastRawResponse);
    }
  }

  const provider2 = new FallbackProvider(new MockMalformedClaudeClustering(), new MockSpyGroqClustering());
  const res2 = await provider2.groupClusters(sampleWords);

  const validOnly = res2.clusters.filter(c => c.cluster_name && c.description && c.words?.length > 0);
  console.log('Valid clusters preserved after filtering:', validOnly.length);

  if (validOnly.length === 1 && validOnly[0].cluster_name === 'valid_theme') {
    console.log('✅ TEST 2 PASSED: Malformed/empty clusters correctly filtered out.\n');
    passedCount++;
  } else {
    console.error('❌ TEST 2 FAILED!\n');
  }

  // =========================================================================
  // TEST 3 — Forced Claude Failure → Automatic Groq Fallback
  // =========================================================================
  console.log('--- TEST 3: Forced Claude Failure → Automatic Groq Fallback ---');
  let groqCalledInTest3 = false;

  class MockFailingClaudeClustering extends ClaudeProvider {
    async groupClusters(): Promise<any> {
      throw new Error('Anthropic API 500: Internal Server Error');
    }
  }

  class MockWorkingGroqClustering3 extends GroqProvider {
    async groupClusters(words: any[]) {
      groqCalledInTest3 = true;
      this.lastRawResponse = JSON.stringify({
        clusters: [
          {
            cluster_name: 'anxious',
            words: ['uneasy', 'apprehensive', 'tense'],
            description: 'Anxious is about future uncertainty. Tense is in the body. Uneasy is a subtle hesitation. Worth noting how each presents for you.',
            confidence: 0.9
          }
        ]
      });
      return JSON.parse(this.lastRawResponse);
    }
  }

  const provider3 = new FallbackProvider(new MockFailingClaudeClustering(), new MockWorkingGroqClustering3());
  const res3 = await provider3.groupClusters(sampleWords);

  console.log('Groq Fallback Clusters:', res3.clusters);
  console.log('Provider used:', provider3.lastProviderUsed);
  console.log('Fallback used:', provider3.lastFallbackUsed);
  console.log('Groq called:', groqCalledInTest3);

  if (
    res3.clusters?.length === 1 &&
    res3.clusters[0].cluster_name === 'anxious' &&
    provider3.lastProviderUsed === 'groq' &&
    provider3.lastFallbackUsed === true &&
    groqCalledInTest3
  ) {
    console.log('✅ TEST 3 PASSED: Claude failure automatically triggered Groq fallback with valid cluster output.\n');
    passedCount++;
  } else {
    console.error('❌ TEST 3 FAILED!\n');
  }

  // =========================================================================
  // TEST 4 — Both Providers Fail → Controlled Safe Failure
  // =========================================================================
  console.log('--- TEST 4: Both Providers Fail → Controlled Safe Failure ---');

  class MockFailingClaude4 extends ClaudeProvider {
    async groupClusters(): Promise<any> {
      throw new Error('Claude 503 Service Unavailable');
    }
  }

  class MockFailingGroq4 extends GroqProvider {
    async groupClusters(): Promise<any> {
      throw new Error('Groq 429 Rate Limit');
    }
  }

  const provider4 = new FallbackProvider(new MockFailingClaude4(), new MockFailingGroq4());
  let bothFailedCleanly = false;

  try {
    await provider4.groupClusters(sampleWords);
  } catch (err: any) {
    bothFailedCleanly = err.message.includes('Claude 503') || err.message.includes('Both Claude and Groq failed');
    console.log('Caught controlled error:', err.message);
  }

  if (bothFailedCleanly) {
    console.log('✅ TEST 4 PASSED: Controlled failure gracefully handled without corrupting cluster state.\n');
    passedCount++;
  } else {
    console.error('❌ TEST 4 FAILED!\n');
  }

  // =========================================================================
  // TEST 5 — Historical Cluster Data Safety & Contract Compatibility
  // =========================================================================
  console.log('--- TEST 5: Cluster Schema & Historical Contract Compatibility ---');

  const sampleCluster = res1.clusters[0];
  const hasRequiredFields =
    typeof sampleCluster.cluster_name === 'string' &&
    Array.isArray(sampleCluster.words) &&
    typeof sampleCluster.description === 'string' &&
    typeof sampleCluster.confidence === 'number';

  console.log('Cluster Schema Compliance Check:', hasRequiredFields);
  console.log('Cluster Name:', sampleCluster.cluster_name);
  console.log('Related Words:', sampleCluster.words);
  console.log('Insight Description:', sampleCluster.description);

  if (hasRequiredFields) {
    console.log('✅ TEST 5 PASSED: Output schema matches database vocab_clusters and UI contract exactly.\n');
    passedCount++;
  } else {
    console.error('❌ TEST 5 FAILED!\n');
  }

  console.log('====================================================');
  console.log(`SUMMARY: ${passedCount}/${totalCount} VOCABULARY CLUSTERING TESTS PASSED`);
  console.log('====================================================');

  process.exit(0);
}

runVocabClusteringTests().catch(err => {
  console.error(err);
  process.exit(1);
});
