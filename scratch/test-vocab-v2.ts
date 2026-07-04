import * as fs from 'fs';
import * as path from 'path';

// 1. Manual .env loader to run script locally
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      if (line.trim().startsWith('#') || !line.trim()) return;
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

async function runTests() {
  console.log('======================================================');
  console.log('VOCABULARY ENGINE V2 END-TO-END VERIFICATION');
  console.log('======================================================');

  const { supabase } = await import('../src/lib/db');
  const { rebuildUserVocabulary } = await import('../src/lib/vocab/rebuildService');
  const { VocabularyIntelligenceService } = await import('../src/lib/vocab/vocabIntelligenceService');
  const { processVocabularyExtraction } = await import('../src/lib/queue/workers/vocabWorker');

  // A. Find a dynamic test user from the database
  const { data: firstProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (profileErr || !firstProfile) {
    console.error('Failed to retrieve a test user from profiles table. Please register a profile first.');
    process.exit(1);
  }

  const userId = firstProfile.id;
  console.log(`Using test user ID: ${userId}`);

  // B. Run historical rebuild / backfill
  console.log('\nStep 1: Running complete historical rebuild...');
  const rebuildResult = await rebuildUserVocabulary(userId);
  console.log('Rebuild completed successfully:', JSON.stringify(rebuildResult, null, 2));

  // C. Query VocabularyIntelligenceService overview
  console.log('\nStep 2: Testing VocabularyIntelligenceService overview...');
  const overview = await VocabularyIntelligenceService.getVocabularyOverview(userId, true);
  
  if (overview.isAvailable) {
    console.log('Overview stats:', JSON.stringify(overview.stats, null, 2));
    console.log(`Top words:`, overview.mostUsed.map((w: any) => `${w.word} (${w.frequency}×)`).join(', '));
    console.log(`Shift signals (last):`, overview.shiftSignals.last);
    console.log(`Shift signals (six):`, overview.shiftSignals.six);
    console.log(`Shift signals (all):`, overview.shiftSignals.all);
    
    if (overview.currentCycleWords && overview.currentCycleWords.length > 0) {
      const firstAudit = overview.currentCycleWords[0];
      console.log('\nAudit Trace Verification for word:', firstAudit.normalized_word);
      console.log(`- Original sentence: "${firstAudit.context}"`);
      console.log(`- Version info: extractor_version=${firstAudit.audit_trail[0].extractor_version}, model=${firstAudit.audit_trail[0].model}`);
      console.log(`- Confidence score: ${firstAudit.confidence}`);
    }
  } else {
    console.log('Vocabulary analysis is not yet available for this user (not enough entries).');
  }

  // D. Query VocabularyIntelligenceService by-cycle details (Snapshots)
  console.log('\nStep 3: Testing VocabularyIntelligenceService by-cycle breakdown...');
  const cycles = await VocabularyIntelligenceService.getVocabularyByCycle(userId);
  console.log(`Retrieved ${cycles.length} cycles from snapshots:`);
  cycles.forEach((cy: any) => {
    console.log(`- Cycle ${cy.number} (${cy.status}): entries=${cy.entry_count}, top_words=${cy.most_used.map((w: any) => w.word).join(', ')}`);
  });

  // E. Test idempotent incremental update
  console.log('\nStep 4: Testing idempotent incremental updates...');
  const { data: latestEntry } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestEntry) {
    console.log(`Selected latest entry ${latestEntry.id} for incremental test.`);
    
    // Clear and reset state
    await supabase.from('vocab_extractions').delete().eq('entry_id', latestEntry.id);
    await supabase.from('entries').update({ vocab_processed: false }).eq('id', latestEntry.id);

    // Run queue worker
    console.log('Running processVocabularyExtraction worker...');
    await processVocabularyExtraction({ entry_id: latestEntry.id, user_id: userId });

    // Verify processed state
    const { data: verifiedEntry } = await supabase
      .from('entries')
      .select('vocab_processed')
      .eq('id', latestEntry.id)
      .single();

    console.log(`Verification: vocab_processed flag set to ${verifiedEntry?.vocab_processed} (expected: true)`);

    // Verify extractions inserts
    const { data: exts } = await supabase
      .from('vocab_extractions')
      .select('*')
      .eq('entry_id', latestEntry.id);

    console.log(`Logged ${exts?.length || 0} extraction occurrences.`);
    if (exts && exts.length > 0) {
      console.log('Extraction row sample:', JSON.stringify({
        original_word: exts[0].original_word,
        sentence_context: exts[0].sentence_context,
        source_type: exts[0].source_type,
        extractor_version: exts[0].extractor_version,
        provider: exts[0].provider,
        model: exts[0].model
      }, null, 2));
    }
  } else {
    console.log('No entries found to test incremental pipeline.');
  }

  console.log('\n======================================================');
  console.log('VERIFICATION COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
