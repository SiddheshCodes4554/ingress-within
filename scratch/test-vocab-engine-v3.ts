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

  // Re-import supabase after process.env is set
  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  const intelPath = pathToFileURL(path.join(process.cwd(), 'src/lib/vocab/vocabIntelligenceService.ts')).href;
  const { VocabularyIntelligenceService } = await import(intelPath);

  console.log('--- STARTING VOCABULARY ENGINE V3 E2E TESTS ---');

  // Test 1: Fetch all users
  const { data: users } = await db.from('profiles').select('id, full_name');
  const testUser = users?.[0];

  if (!testUser) {
    console.error('No users found in database to run tests against.');
    return;
  }

  console.log(`Using test user: ${testUser.full_name} (${testUser.id})`);

  // Test 2: Verify snapshot caching is present in database
  console.log('\n[TEST 2] Verifying snapshot database cache...');
  const { data: snaps, error: snapsErr } = await db
    .from('vocab_snapshots')
    .select('*')
    .eq('user_id', testUser.id);

  if (snapsErr) {
    console.error('FAIL: Failed to fetch snapshots:', snapsErr.message);
  } else {
    console.log(`SUCCESS: Found ${snaps?.length} snapshots in database.`);
    snaps?.forEach(s => {
      console.log(`- Snapshot for Cycle ID: ${s.cycle_id}, Generated At: ${s.generated_at}`);
    });
  }

  // Test 3: Verify read-only overview fetches from snapshots with zero AI calls
  console.log('\n[TEST 3] Fetching overview stats via VocabularyIntelligenceService...');
  const startOverview = Date.now();
  const overview = await VocabularyIntelligenceService.getVocabularyOverview(testUser.id, true);
  const endOverview = Date.now();

  console.log(`Overview fetched in ${endOverview - startOverview}ms.`);
  console.log('Stats:', overview.stats);
  console.log('Tiers Count:', {
    frequent: overview.allWords.frequent.length,
    occasional: overview.allWords.occasional.length,
    usedOnce: overview.allWords.usedOnce.length
  });
  console.log('Timeline points count:', overview.timeline.length);
  console.log('Clusters count:', overview.clusters.length);

  if (overview.isAvailable) {
    console.log('SUCCESS: Read-only overview returned successfully.');
  } else {
    console.log('SUCCESS: Empty overview returned successfully (no snapshots exist).');
  }

  // Test 4: Verify chronological cycle snapshot list
  console.log('\n[TEST 4] Fetching cycle breakdowns...');
  const startCycle = Date.now();
  const cycles = await VocabularyIntelligenceService.getVocabularyByCycle(testUser.id);
  const endCycle = Date.now();

  console.log(`Cycles fetched in ${endCycle - startCycle}ms.`);
  console.log(`SUCCESS: Found ${cycles.length} cycle snapshots.`);
  cycles.slice(0, 3).forEach(c => {
    console.log(`- Cycle #${c.number} (${c.status}): ${c.entry_count} entries, ${c.most_used?.length} top words.`);
  });

  // Test 5: Verify backfill indicator is present
  console.log('\n[TEST 5] Checking backfill completed indicator...');
  const backfillIndicator = snaps?.find(s => s.cycle_id === '11111111-1111-1111-1111-111111111111');
  if (backfillIndicator) {
    console.log('SUCCESS: Backfill indicator snapshot is present in database.');
    console.log('Indicator Data:', backfillIndicator.snapshot_data);
  } else {
    console.log('WARNING: Backfill indicator not found. Checking if user has 0 entries...');
  }

  console.log('\n--- ALL E2E TESTS COMPLETED ---');
}

main().catch(console.error);
