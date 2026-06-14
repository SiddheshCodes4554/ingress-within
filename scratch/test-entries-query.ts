import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

async function testInsert() {
  const { data: users } = await supabase.from('users').select('id').limit(1);
  if (!users || users.length === 0) {
    console.error('No users found');
    return;
  }
  const userId = users[0].id;

  const { data, error } = await supabase
    .from('daily_sessions')
    .insert({
      user_id: userId,
      day_number: 1,
      status: 'start',
      session_data: {}
    })
    .select()
    .single();

  if (error) {
    console.error('Insert daily_session failed:', error);
  } else {
    console.log('Insert daily_session succeeded! Columns:', Object.keys(data));
    console.log('Row details:', data);
    
    // Clean it up
    await supabase.from('daily_sessions').delete().eq('id', data.id);
  }
}

testInsert();
