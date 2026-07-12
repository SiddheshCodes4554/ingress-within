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

  const testUser = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

  console.log('Simulating synchronous reflection pipeline...');

  // 1. Fetch the active cycle for the user
  const { data: activeCycle } = await db
    .from('cycles')
    .select('id')
    .eq('user_id', testUser)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (!activeCycle) {
    console.error('No active cycle found for test user!');
    return;
  }

  // 2. Clear any entries created today to bypass daily writing limits
  const todayStr = new Date().toISOString().split('T')[0];
  const todayStart = `${todayStr}T00:00:00Z`;
  await db.from('entries').delete().eq('user_id', testUser).gte('created_at', todayStart);

  // 3. Insert new entry
  const content = "I feel quite calm, steady, and capable today. Doing some reading in the garden and taking a break from office emails really helped.";
  const { data: newEntry, error: insertError } = await db
    .from('entries')
    .insert({
      user_id: testUser,
      content,
      new_entry_text_encrypted: content,
      entry_type: 'new_only',
      word_count: content.split(/\s+/).length,
      cycle_id: activeCycle.id,
      cycle_day: 1,
      written_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError || !newEntry) {
    console.error('Failed to insert test entry:', insertError);
    return;
  }

  console.log(`Inserted entry ${newEntry.id}. Running workers synchronously...`);

  const startTime = Date.now();

  // 4. Run crisis detection synchronously
  const crisisWorkerPath = pathToFileURL(path.join(process.cwd(), 'src/lib/queue/workers/crisisDetectionWorker.ts')).href;
  const { processCrisisDetection } = await import(crisisWorkerPath);
  await processCrisisDetection({ entry_id: newEntry.id, user_id: testUser });

  // 5. Run reflection generation synchronously
  const reflectionWorkerPath = pathToFileURL(path.join(process.cwd(), 'src/lib/queue/workers/reflectionWorker.ts')).href;
  const { processReflectionGeneration } = await import(reflectionWorkerPath);
  await processReflectionGeneration({ entry_id: newEntry.id, user_id: testUser });

  const duration = Date.now() - startTime;
  console.log(`Sync pipeline completed in ${duration}ms.`);

  // 6. Fetch the generated reflection
  const { data: reflection, error: reflError } = await db
    .from('reflections')
    .select('*')
    .eq('entry_id', newEntry.id)
    .maybeSingle();

  console.log('\nGenerated Reflection:');
  console.log(reflection);

  // Assertions
  if (reflError || !reflection) {
    throw new Error('FAILED: Reflection was not generated!');
  }

  if (reflection.status !== 'ready') {
    throw new Error(`FAILED: Reflection status is not ready (got: ${reflection.status})`);
  }

  console.log('\n=============================================');
  console.log('SUCCESS: Synchronous reflection pipeline verified!');
  console.log('=============================================');
}

main().catch(err => {
  console.error('\nVerification Failed:', err);
  process.exit(1);
});
