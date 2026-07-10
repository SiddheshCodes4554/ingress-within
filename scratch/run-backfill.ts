import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      if (line.trim().startsWith('#') || !line.trim()) return;
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

async function main() {
  const dbPath = pathToFileURL(path.join(process.cwd(), 'src/lib/db.ts')).href;
  const { supabase: db } = await import(dbPath);

  const knowledgePath = pathToFileURL(path.join(process.cwd(), 'src/lib/knowledge/knowledgeService.ts')).href;
  const { KnowledgeService } = await import(knowledgePath);

  const args = process.argv.slice(2);
  const isAll = args.includes('--all');
  const force = args.includes('--force');
  const targetUserId = args.find(arg => !arg.startsWith('--'));

  console.log(`=== Knowledge Engine: Rebuild & Backfill CLI ===`);
  console.log(`Options: force=${force}`);

  if (isAll) {
    console.log('\nRunning global backfill for all existing users...');
    
    // Fetch all profiles
    const { data: profiles, error: profErr } = await db
      .from('profiles')
      .select('id, full_name');

    if (profErr || !profiles) {
      console.error('Failed to load profiles:', profErr?.message);
      process.exit(1);
    }

    console.log(`Found ${profiles.length} profiles to check.`);

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const profile of profiles) {
      const userId = profile.id;
      const name = profile.full_name || 'Unknown';

      // Check if user has any entries or thread responses
      const [
        { count: entryCount },
        { count: threadCount }
      ] = await Promise.all([
        db.from('entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        db.from('thread_responses').select('*', { count: 'exact', head: true }).eq('user_id', userId)
      ]);

      if ((entryCount || 0) === 0 && (threadCount || 0) === 0) {
        console.log(`Skipping user ${name} (${userId}) — no entries or thread responses found.`);
        skipped++;
        continue;
      }

      console.log(`\n---------------------------------------------`);
      console.log(`Starting backfill for: ${name} (${userId})`);
      console.log(`---------------------------------------------`);

      try {
        await KnowledgeService.backfillUser(userId, force);
        console.log(`Completed backfill for ${name}.`);
        processed++;
      } catch (err: any) {
        console.error(`Failed backfill for ${name}:`, err.message || err);
        failed++;
      }
    }

    console.log(`\n=== Global Backfill Finished ===`);
    console.log(`Processed: ${processed}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);

  } else if (targetUserId) {
    // Single user
    console.log(`\nRunning backfill for target user: ${targetUserId}`);

    const { data: profile, error: profErr } = await db
      .from('profiles')
      .select('id, full_name')
      .eq('id', targetUserId)
      .maybeSingle();

    if (profErr || !profile) {
      console.error(`Failed to find profile for user ${targetUserId}:`, profErr?.message || 'Not found');
      process.exit(1);
    }

    console.log(`Found profile: ${profile.full_name || 'Unknown'}`);

    try {
      const status = await KnowledgeService.backfillUser(targetUserId, force);
      console.log(`Backfill result status:`, status.status);
      console.log(`Step:`, status.current_step);
      console.log(`Events: processed=${status.processed_events}, remaining=${status.remaining_events}`);
    } catch (err: any) {
      console.error(`Backfill execution failed:`, err.message || err);
      process.exit(1);
    }
  } else {
    console.error('Error: Please specify a target user ID or run with --all.');
    console.log('Usage:');
    console.log('  npx tsx scratch/run-backfill.ts <user-uuid> [--force]');
    console.log('  npx tsx scratch/run-backfill.ts --all [--force]');
    process.exit(1);
  }
}

main().catch(console.error);
