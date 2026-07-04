import fs from 'fs';
import path from 'path';

// Load .env file
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

async function runBackfill() {
  const { supabase } = await import('../src/lib/db');
  const { backfillWeeklyReports } = await import('../src/lib/weeklyReportBackfill');

  console.log('Fetching all users in the system...');
  const { data: users, error: usersErr } = await supabase.from('users').select('id, name');
  if (usersErr || !users) {
    console.error('Failed to fetch users:', usersErr?.message);
    return;
  }

  console.log(`Found ${users.length} users in the database. Starting weekly summaries backfill audit...\n`);

  for (const user of users) {
    console.log(`===============================================`);
    console.log(`Processing User: ${user.name || 'Anonymous'} (${user.id})`);
    console.log(`===============================================`);
    try {
      const result = await backfillWeeklyReports(user.id);
      console.log(`Result:`, result);
    } catch (e: any) {
      console.error(`Failed to backfill user ${user.id}:`, e.message || e);
    }
    console.log('\n');
  }

  console.log('Weekly summary backfill audit completed for all users.');
}

runBackfill().catch(console.error);
