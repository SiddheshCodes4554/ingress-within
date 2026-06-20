import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

async function checkRealColumns() {
  console.log('--- Checking reflections columns ---');
  const { data: reflections, error: reflectionsError } = await supabase.from('reflections').select('closing_question, classification').limit(1);
  if (reflectionsError) {
    console.log('❌ reflections columns missing:', reflectionsError.message);
  } else {
    console.log('✅ reflections columns exist!', reflections);
  }

  console.log('--- Checking entries columns ---');
  const { data: entries, error: entriesError } = await supabase.from('entries').select('arc_scoring_note').limit(1);
  if (entriesError) {
    console.log('❌ entries columns missing:', entriesError.message);
  } else {
    console.log('✅ entries columns exist!', entries);
  }

  console.log('--- Checking assessments columns ---');
  const { data: assessments, error: assessmentsError } = await supabase.from('assessments').select('dominant_dimension').limit(1);
  if (assessmentsError) {
    console.log('❌ assessments columns missing:', assessmentsError.message);
  } else {
    console.log('✅ assessments columns exist!', assessments);
  }
}

checkRealColumns();
