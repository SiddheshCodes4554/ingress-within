// scratch/inspect-reflection.js
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

async function run() {
  console.log('=== LATEST ENTRIES & REFLECTIONS STATUS ===');
  
  const { data: entries, error: eErr } = await supabase
    .from('entries')
    .select('id, content, created_at, scoring_status, entry_type, cycle_day')
    .order('created_at', { ascending: false })
    .limit(5);

  if (eErr) {
    console.error('Entries error:', eErr.message);
    return;
  }

  for (const entry of entries) {
    console.log(`\nEntry ID: ${entry.id}`);
    console.log(`Created At: ${entry.created_at}`);
    console.log(`Scoring Status: ${entry.scoring_status}`);
    console.log(`Entry Type: ${entry.entry_type}`);
    console.log(`Cycle Day: ${entry.cycle_day}`);
    console.log(`Content Snippet: "${entry.content?.substring(0, 100)}..."`);
    
    const { data: reflection, error: rErr } = await supabase
      .from('reflections')
      .select('*')
      .eq('entry_id', entry.id)
      .maybeSingle();

    if (rErr) {
      console.error('Reflection error:', rErr.message);
    } else if (reflection) {
      console.log(`Reflection Status: ${reflection.status}`);
      console.log(`Reflection Text: "${reflection.reflection_text}"`);
      console.log(`Closing Question: "${reflection.closing_question}"`);
    } else {
      console.log('No reflection row found for this entry.');
    }
  }
}

run();
