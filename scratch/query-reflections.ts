import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  console.log('Fetching all failed reflections...');
  const { data: reflections, error } = await supabase
    .from('reflections')
    .select('id, entry_id, user_id, status, reflection_text, closing_question, created_at, provider')
    .eq('status', 'failed')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reflections:', error);
    return;
  }

  console.log(`Found ${reflections.length} failed reflections:`);
  console.dir(reflections, { depth: null });
}

check();
