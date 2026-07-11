import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

async function main() {
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

  console.log('=== Checking Knowledge Profile Details ===');
  const { data: profiles } = await db.from('knowledge_profile').select('*').limit(1);
  if (profiles && profiles.length > 0) {
    const p = profiles[0];
    console.log('Profile Keys:', Object.keys(p));
    console.log('Emotion Model:', JSON.stringify(p.emotion_model, null, 2));
    console.log('Vocabulary Model:', JSON.stringify(p.vocabulary_model, null, 2));
    console.log('Pattern Model:', JSON.stringify(p.pattern_model, null, 2));
  } else {
    console.log('No profiles found.');
  }
}

main().catch(console.error);
