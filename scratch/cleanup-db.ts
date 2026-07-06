import fs from 'fs';
import path from 'path';

// 1. Load .env file
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

async function runCleanup() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

  console.log('=== DATABASE INTEGRITY REPAIR ===\n');

  // 1. Correct day_start/day_end for week 2 weekly summaries
  console.log('Correcting day ranges for Week 2 summaries...');
  const { data: updatedSummaries, error: updateErr } = await supabase
    .from('weekly_summaries')
    .update({ day_start: 8, day_end: 14 })
    .eq('week_number', 2)
    .select();

  if (updateErr) {
    console.error('Error correcting Week 2 summaries:', updateErr.message);
  } else {
    console.log('Corrected summaries:', updatedSummaries);
  }

  // 2. Correct day_start/day_end for week 3 weekly summaries (just in case)
  console.log('Correcting day ranges for Week 3 summaries...');
  const { data: updatedSummaries3, error: updateErr3 } = await supabase
    .from('weekly_summaries')
    .update({ day_start: 15, day_end: 21 })
    .eq('week_number', 3)
    .select();

  if (updateErr3) {
    console.error('Error correcting Week 3 summaries:', updateErr3.message);
  } else {
    console.log('Corrected summaries:', updatedSummaries3);
  }

  // 3. Remove rogue leftover test entry
  console.log('\nDeleting rogue leftover test entry 0fd8f79a-14e3-4981-964a-5c5e8eb4c316...');
  const { error: delEntryErr } = await supabase
    .from('entries')
    .delete()
    .eq('id', '0fd8f79a-14e3-4981-964a-5c5e8eb4c316');

  if (delEntryErr) {
    console.error('Error deleting rogue entry:', delEntryErr.message);
  } else {
    console.log('Deleted rogue entry successfully.');
  }

  // 4. Remove rogue crisis log
  console.log('Deleting rogue leftover crisis log 5d3810da-b1e2-41a5-82dc-7678708e681d...');
  const { error: delCrisisErr } = await supabase
    .from('crisis_log')
    .delete()
    .eq('id', '5d3810da-b1e2-41a5-82dc-7678708e681d');

  if (delCrisisErr) {
    console.error('Error deleting rogue crisis log:', delCrisisErr.message);
  } else {
    console.log('Deleted rogue crisis log successfully.');
  }

  console.log('\nDatabase integrity repair complete.');
}

runCleanup().catch(console.error);
