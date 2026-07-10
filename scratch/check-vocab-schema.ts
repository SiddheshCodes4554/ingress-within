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

  const { data: exts } = await db.from('vocab_extractions').select('*').limit(1);
  console.log('vocab_extractions columns:', Object.keys(exts?.[0] || {}));

  const { data: snaps } = await db.from('vocab_snapshots').select('*').limit(1);
  console.log('vocab_snapshots columns:', Object.keys(snaps?.[0] || {}));

  const { data: words } = await db.from('vocab_words').select('*').limit(1);
  console.log('vocab_words columns:', Object.keys(words?.[0] || {}));
}

main().catch(console.error);
