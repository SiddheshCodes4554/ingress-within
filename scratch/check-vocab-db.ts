import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVocabDb() {
  console.log('Checking vocab_words table...');
  const { data: words, error: wordsError } = await supabase.from('vocab_words').select('*').limit(1);
  if (wordsError) {
    console.error('vocab_words error:', wordsError.message, wordsError.code);
  } else {
    console.log('vocab_words exists! Columns present in result:', Object.keys(words[0] || {}));
  }

  console.log('Checking vocab_clusters table...');
  const { data: clusters, error: clustersError } = await supabase.from('vocab_clusters').select('*').limit(1);
  if (clustersError) {
    console.error('vocab_clusters error:', clustersError.message, clustersError.code);
  } else {
    console.log('vocab_clusters exists! Columns present in result:', Object.keys(clusters[0] || {}));
  }
}

checkVocabDb();
