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

  // 1. Fetch entries for Week 1 (day 1 to 7)
  const { data: dbEntries, error: err1 } = await db
    .from('entries')
    .select('*')
    .eq('user_id', testUser)
    .gte('cycle_day', 1)
    .lte('cycle_day', 7);

  console.log('Week 1 Entries count:', dbEntries?.length, 'Error:', err1);
  dbEntries?.forEach(e => {
    console.log(`- Day: ${e.cycle_day}, ID: ${e.id}, Cycle ID: ${e.cycle_id}`);
  });

  if (!dbEntries || dbEntries.length === 0) return;

  const journalIds = dbEntries.map(e => e.id);
  const cycleId = dbEntries[0].cycle_id;

  // 2. Fetch vocab_extractions using the exact collector query
  const { data: entryExts, error: err2 } = await db
    .from('vocab_extractions')
    .select('normalized_word, word, confidence, sentence, created_at, entry_id')
    .eq('user_id', testUser)
    .eq('cycle_id', cycleId)
    .in('entry_id', journalIds);

  console.log('\nQuery result with cycle_id constraint:');
  console.log('Extractions count:', entryExts?.length, 'Error:', err2);
  if (entryExts && entryExts.length > 0) {
    console.log('Extractions:', entryExts.map(e => e.word));
  }

  // 3. Fetch vocab_extractions WITHOUT cycle_id constraint
  const { data: entryExtsNoCycle, error: err3 } = await db
    .from('vocab_extractions')
    .select('normalized_word, word, confidence, sentence, created_at, entry_id')
    .eq('user_id', testUser)
    .in('entry_id', journalIds);

  console.log('\nQuery result WITHOUT cycle_id constraint:');
  console.log('Extractions count:', entryExtsNoCycle?.length, 'Error:', err3);
}

main().catch(console.error);
