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

async function checkAll() {
  const { supabase } = await import('../src/lib/db');

  const { data: users } = await supabase.from('users').select('*');
  console.log('=== USERS ===');
  console.log(users);

  const { data: cycles } = await supabase.from('cycles').select('*');
  console.log('\n=== CYCLES ===');
  console.log(cycles);

  const { data: summaries } = await supabase.from('weekly_summaries').select('*');
  console.log('\n=== ALL WEEKLY SUMMARIES ===');
  console.log(summaries?.map(s => ({
    id: s.id,
    user_id: s.user_id,
    cycle_id: s.cycle_id,
    week_number: s.week_number,
    status: s.status,
    title: s.title
  })));
}

checkAll().catch(console.error);
