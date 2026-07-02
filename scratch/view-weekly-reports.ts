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

async function viewWeekly() {
  const { data: summaries, error } = await supabase.from('weekly_summaries').select('*').order('week_number', { ascending: true });
  if (error) {
    console.error('Error fetching weekly_summaries:', error.message);
  } else {
    console.log('Weekly Summaries:');
    summaries?.forEach(s => {
      console.log(`ID: ${s.id}, Week: ${s.week_number}, Title: ${s.title}, CreatedAt: ${s.created_at}, GeneratedAt: ${s.generated_at}, Status: ${s.status}`);
      console.log('Weekly Stats:', s.report_data?.weekly_stats);
    });
  }
}

viewWeekly();
