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

  const rebuildPath = pathToFileURL(path.join(process.cwd(), 'src/lib/vocab/rebuildService.ts')).href;
  const { rebuildUserVocabulary } = await import(rebuildPath);

  console.log('Fetching all users...');
  const { data: users, error } = await db.from('profiles').select('id, full_name');
  if (error) {
    console.error('Failed to fetch users:', error.message);
    return;
  }

  console.log(`Found ${users?.length} users. Triggering vocabulary rebuilds...`);
  for (const u of users || []) {
    console.log(`\nRebuilding vocabulary for ${u.full_name} (${u.id})...`);
    try {
      const res = await rebuildUserVocabulary(u.id, true); // true = bypass AI for speed & deterministic NLP testing
      console.log(`Rebuild complete for ${u.full_name}:`, JSON.stringify(res));
    } catch (err: any) {
      console.error(`Rebuild failed for ${u.full_name}:`, err.message || err);
    }
  }

  console.log('\nAll users vocabulary rebuild completed successfully.');
}

main().catch(console.error);
