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

  const backfillScriptPath = path.resolve(process.cwd(), 'scratch/backfill-knowledge.ts');
  
  console.log('=== Global Knowledge Engine Rebuild Backfill ===');

  // Fetch all profiles
  console.log('Fetching all user profiles...');
  const { data: profiles, error: profErr } = await db
    .from('profiles')
    .select('id, full_name');

  if (profErr || !profiles) {
    console.error('Error fetching profiles:', profErr?.message);
    return;
  }

  console.log(`Found ${profiles.length} profiles to check.`);

  const { fork } = await import('child_process');

  for (const profile of profiles) {
    const userId = profile.id;
    const userName = profile.full_name || 'Unknown User';

    // Check if user has any entries or thread responses
    const { count: entriesCount } = await db
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: threadsCount } = await db
      .from('thread_responses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if ((entriesCount || 0) === 0 && (threadsCount || 0) === 0) {
      console.log(`Skipping user ${userName} (${userId}) — no entries or thread responses found.`);
      continue;
    }

    console.log(`\n======================================================`);
    console.log(`Starting chronological backfill for user: ${userName} (${userId})`);
    console.log(`======================================================`);

    // Run backfill-knowledge.ts in a child process sequentially
    await new Promise<void>((resolve) => {
      const child = fork(backfillScriptPath, [userId]);
      child.on('close', (code) => {
        console.log(`Backfill process for ${userName} closed with code ${code}`);
        resolve();
      });
    });
  }

  console.log('\n=== Global Rebuild Backfill Run Completed ===');
}

main().catch(console.error);
