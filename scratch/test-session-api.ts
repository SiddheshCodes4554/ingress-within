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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase variables in .env!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';

async function testSessionApi() {
  console.log('--- TEST SESSION API LOGIC ---');
  
  // 1. Look for an active session in progress (status !== 'complete')
  const { data: activeSessions, error: activeError } = await supabase
    .from('daily_sessions')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'complete')
    .order('created_at', { ascending: false })
    .limit(1);

  console.log('Active sessions query result:', { activeSessions, activeError });

  // 2. Look for the latest completed session to see if it was completed recently
  const { data: completedSessions, error: completedError } = await supabase
    .from('daily_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'complete')
    .order('completed_at', { ascending: false })
    .limit(1);

  console.log('Completed sessions query result:', { completedSessions, completedError });

  if (completedSessions && completedSessions.length > 0) {
    const latest = completedSessions[0];
    
    // Simulate local midnight header
    const localMidnight = new Date();
    localMidnight.setHours(0, 0, 0, 0);
    const startRange = localMidnight.toISOString();
    
    const isCompletedToday = new Date(latest.completed_at).getTime() >= new Date(startRange).getTime();
    console.log('startRange:', startRange);
    console.log('latest.completed_at:', latest.completed_at);
    console.log('isCompletedToday:', isCompletedToday);

    const responsePayload = {
      success: true,
      exists: isCompletedToday,
      isCompletedToday,
      session: latest
    };
    console.log('Response payload when completed exists:', responsePayload);
  }
}

testSessionApi();
