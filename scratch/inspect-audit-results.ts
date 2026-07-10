import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

async function main() {
  // Load env variables
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
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
  } catch (e) {
    console.error('Could not read .env file:', e.message);
  }

  // Re-import supabase after process.env is set
  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  console.log('=== KNOWLEDGE ENGINE AUDIT STATS ===');

  const [
    { count: eventsCount },
    { count: profilesCount },
    { count: cardsCount },
    { data: statuses },
    { data: profiles }
  ] = await Promise.all([
    db.from('knowledge_events').select('*', { count: 'exact', head: true }),
    db.from('knowledge_profile').select('*', { count: 'exact', head: true }),
    db.from('knowledge_cards').select('*', { count: 'exact', head: true }),
    db.from('knowledge_backfill_status').select('*, profiles(full_name)'),
    db.from('profiles').select('id, full_name')
  ]);

  console.log(`Total Events: ${eventsCount}`);
  console.log(`Total Profiles: ${profilesCount}`);
  console.log(`Total Insight Cards: ${cardsCount}`);

  console.log('\n=== Backfill Statuses ===');
  statuses?.forEach((s: any) => {
    console.log(`User: ${s.profiles?.full_name || 'Unknown'} (${s.user_id})`);
    console.log(`  Status: ${s.status}`);
    console.log(`  Step: ${s.current_step}`);
    console.log(`  Events: processed=${s.processed_events}, remaining=${s.remaining_events}`);
    console.log(`  Started: ${s.started_at}`);
    console.log(`  Completed: ${s.completed_at}`);
  });
}

main().catch(console.error);
