import fs from 'fs';
import path from 'path';

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

async function inspect() {
  try {
    const { supabase } = await import('../src/lib/db');
    const { data: snaps, error } = await supabase
      .from('pattern_snapshots')
      .select('id, user_id, cycle_id, cycle_number, snapshot_status, snapshot_data, generated_at, updated_at');
    
    if (error) {
      console.log('Error querying pattern_snapshots:', error.code, error.message);
      return;
    }
    
    console.log(`Total pattern snapshots: ${snaps?.length}`);
    for (const snap of (snaps || [])) {
      console.log(`Snapshot for user ${snap.user_id}, cycle ${snap.cycle_number}:`);
      console.log(JSON.stringify(snap.snapshot_data, null, 2));
    }

    const { data: cycles, error: cyclesErr } = await supabase
      .from('cycles')
      .select('id, user_id, cycle_number, status, start_date, created_at');
    if (cyclesErr) {
      console.log('Error querying cycles:', cyclesErr.code, cyclesErr.message);
    } else {
      console.log(`Total cycles: ${cycles?.length}`);
      console.log('Cycles:', JSON.stringify(cycles, null, 2));
    }

    const { data: weeklySummaries, error: summariesErr } = await supabase
      .from('weekly_summaries')
      .select('id, user_id, cycle_id, week_number, title, status, created_at');
    if (summariesErr) {
      console.log('Error querying weekly_summaries:', summariesErr.code, summariesErr.message);
    } else {
      console.log(`Total weekly summaries: ${weeklySummaries?.length}`);
      console.log('Weekly Summaries:', JSON.stringify(weeklySummaries, null, 2));
    }

  } catch (err: any) {
    console.error('Catch error:', err);
  }
}

inspect();
