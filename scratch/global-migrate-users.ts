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

process.env.BYPASS_REDIS = 'true';

async function migrateAllUsers() {
  console.log('=== GLOBAL MULTI-TENANT INTELLIGENCE MIGRATION MGR ===\n');

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  const { processIntelligenceRebuild } = await import('../src/lib/queue/workers/intelligenceRebuildWorker');

  // Fetch all users in the system
  const { data: users, error: usersErr } = await supabase.from('users').select('id, name');
  if (usersErr || !users) {
    throw new Error(`Failed to fetch users: ${usersErr?.message}`);
  }

  console.log(`Found ${users.length} users in the database:`, users.map(u => `${u.name} (${u.id})`));

  const subsystems: Array<'vocabulary' | 'reports' | 'patterns' | 'assessment' | 'exercise'> = [
    'patterns',
    'assessment',
    'exercise',
    'vocabulary',
    'reports'
  ];

  for (const user of users) {
    console.log(`\n-----------------------------------------------`);
    console.log(`Migrating User: ${user.name || 'Anonymous'} (${user.id})`);
    console.log(`-----------------------------------------------`);

    for (const subsystem of subsystems) {
      console.log(`Running rebuild for subsystem: "${subsystem}"...`);
      try {
        await processIntelligenceRebuild({
          user_id: user.id,
          subsystem
        });
        console.log(`Success: "${subsystem}" rebuild completed.`);
      } catch (err: any) {
        console.error(`Error rebuilding "${subsystem}" for user ${user.id}:`, err.message || err);
      }
      // Brief delay between subsystems to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n=== Global Multi-Tenant Migration Completed for all users! ===');
}

migrateAllUsers().catch(console.error);
