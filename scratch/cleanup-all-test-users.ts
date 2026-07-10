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

  const testUserIds = [
    '99999999-9999-9999-9999-999999999999',
    '11111111-1111-1111-1111-111111111111'
  ];

  console.log('=== Cleaning Up All Legacy Test Users ===');

  for (const testUserId of testUserIds) {
    console.log(`Purging test user: ${testUserId}`);
    
    await db.from('knowledge_backfill_status').delete().eq('user_id', testUserId);
    await db.from('knowledge_cards').delete().eq('user_id', testUserId);
    await db.from('knowledge_snapshots').delete().eq('user_id', testUserId);
    await db.from('knowledge_profile').delete().eq('user_id', testUserId);
    await db.from('knowledge_events').delete().eq('user_id', testUserId);
    
    await db.from('entry_scores').delete().eq('user_id', testUserId);
    await db.from('vocab_extractions').delete().eq('user_id', testUserId);
    await db.from('pattern_snapshots').delete().eq('user_id', testUserId);
    await db.from('weekly_summaries').delete().eq('user_id', testUserId);
    await db.from('entries').delete().eq('user_id', testUserId);
    await db.from('cycles').delete().eq('user_id', testUserId);
    await db.from('profiles').delete().eq('id', testUserId);
    await db.from('users').delete().eq('id', testUserId);
    
    try {
      await db.auth.admin.deleteUser(testUserId);
    } catch (authErr) {
      // Might not exist in auth, ignore
    }
  }

  console.log('Cleanup complete.');
}

main().catch(console.error);
