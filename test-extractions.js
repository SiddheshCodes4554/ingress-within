// test-extractions.js
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env');
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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const siddheshId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
  const { data: extractions, error } = await supabase
    .from('vocab_extractions')
    .select('entry_id, word, normalized_word, sentence')
    .eq('user_id', siddheshId);
  
  if (error) {
    console.error('Error fetching extractions:', error);
    return;
  }

  // Group by entry_id
  const byEntry = {};
  extractions.forEach(e => {
    const key = e.entry_id || 'null';
    byEntry[key] = byEntry[key] || [];
    byEntry[key].push(e.word);
  });

  console.log('Extractions by Entry ID:');
  for (const entryId in byEntry) {
    console.log(`\nEntry ID: ${entryId}`);
    console.log('Words:', byEntry[entryId]);
  }
}

check();
