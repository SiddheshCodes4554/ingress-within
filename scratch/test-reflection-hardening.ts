// Parse .env first
import fs from 'fs';
import path from 'path';
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
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
      if (key && val) {
        process.env[key] = val;
      }
    }
  });
}

async function main() {
  // Load modules dynamically after env is populated
  const { supabase } = await import('../src/lib/db');
  const { aiProvider } = await import('../src/lib/ai/factory');
  const { processReflectionGeneration, validateReflection } = await import('../src/lib/queue/workers/reflectionWorker');
  console.log('=== Ingress Within: Reflection Engine Hardening Verification ===\n');

  // 1. Check style validator on test strings
  console.log('--- Checking validateReflection constraints ---');
  const validText = "You are feeling a sense of clarity now. Your writing shows you are making space for what matters.";
  const invalidText1 = "You should try to exercise and consider therapy."; // advice + therapy
  const invalidText2 = "I observed that the author is dealing with depression."; // no "you", contains depression

  console.log(`- Valid text check:`, validateReflection(validText));
  console.log(`- Invalid text 1 check (advice/clinical):`, validateReflection(invalidText1));
  console.log(`- Invalid text 2 check (no direct address/clinical):`, validateReflection(invalidText2));
  console.log();

  // 2. Fetch a candidate journal entry from database
  console.log('--- Fetching candidate entry for simulation ---');
  const { data: entries, error: entryErr } = await supabase
    .from('entries')
    .select('id, user_id, content')
    .limit(1);

  if (entryErr || !entries || entries.length === 0) {
    console.error('No journal entries found in database to simulate.');
    return;
  }

  const testEntry = entries[0];
  console.log(`Using Entry ID: ${testEntry.id}`);
  console.log(`User ID: ${testEntry.user_id}`);
  console.log(`Content Snippet: "${testEntry.content.substring(0, 80)}..."`);
  console.log();

  // 3. Test generateReflection with different configurations
  console.log('--- Testing generateReflection directly ---');
  try {
    console.log('1. Calling generateReflection in Standard Mode...');
    const resStandard = await aiProvider.generateReflection(
      testEntry.content,
      "The user is reflective and open.",
      "Question: What is marriage? | Answer: Marriage is a commitment.",
      "Observation: You are cautious about commitments."
    );
    console.log('Standard Result:', JSON.stringify(resStandard, null, 2));
    console.log();

    console.log('2. Calling generateReflection in Simplified Mode (Self-Healing)...');
    const resSimplified = await aiProvider.generateReflection(
      testEntry.content,
      "The user is reflective.",
      undefined,
      undefined,
      true // useSimplifiedPrompt = true
    );
    console.log('Simplified Result:', JSON.stringify(resSimplified, null, 2));
    console.log();

  } catch (err: any) {
    console.error('Provider generateReflection test failed:', err.message || err);
  }

  // 4. Run the full worker pipeline on the test entry
  console.log('--- Running full processReflectionGeneration pipeline ---');
  try {
    // We will bypass Redis/BullMQ and execute the worker function directly
    await processReflectionGeneration({
      entry_id: testEntry.id,
      user_id: testEntry.user_id
    });
    console.log('\nPipeline executed successfully!');

    // Fetch the stored reflection to verify it saved
    const { data: reflection, error: reflErr } = await supabase
      .from('reflections')
      .select('*')
      .eq('entry_id', testEntry.id)
      .maybeSingle();

    if (reflErr) {
      console.error('Failed to query saved reflection:', reflErr.message);
    } else if (reflection) {
      console.log('Stored Reflection details:');
      console.log(`- Status: ${reflection.status}`);
      console.log(`- Provider: ${reflection.provider}`);
      console.log(`- Text: "${reflection.reflection_text.substring(0, 100)}..."`);
      console.log(`- Closing Question: "${reflection.closing_question}"`);
      console.log(`- Classification: ${reflection.classification}`);
    } else {
      console.error('No reflection row found in database for entry!');
    }
  } catch (err: any) {
    console.error('\nWorker pipeline execution failed:', err.message || err);
  }
}

main().catch(console.error);
