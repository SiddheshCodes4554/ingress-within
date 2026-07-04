// scratch/trigger-dev-entry.js
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

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

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${signatureInput}.${signature}`;
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const userId = 'f36d91ed-d484-4ecb-9078-1dfba35ff7c7';
const jwtSecret = process.env.JWT_SECRET || 'jwt_default_secret_dev';

async function run() {
  // 1. Fetch latest active session from DB
  const { data: sessions, error: sErr } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1);

  if (sErr || !sessions || sessions.length === 0) {
    console.error('No active session found in DB:', sErr?.message || 'Empty');
    return;
  }
  const activeSession = sessions[0];
  console.log(`Using active session in DB: ${activeSession.id}, device: ${activeSession.device_id}`);

  // 2. Generate JWT
  const tokenPayload = {
    uid: userId,
    phone: '+918805046256',
    did: activeSession.device_id,
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  const token = signJwt(tokenPayload, jwtSecret);

  // 3. POST new journal entry to local dev server
  const entryText = `I spent some time today reflecting on my progress. It feels good to see small shifts, but I still feel anxious sometimes when thinking about future goals. I want to keep moving forward without putting too much pressure on myself.`;
  console.log('Sending POST to http://localhost:3000/api/entries...');
  
  const res = await fetch('http://localhost:3000/api/entries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `iw-access=${token}`,
      'x-client-today-start': new Date().toISOString(),
      'x-client-date': new Date().toISOString().split('T')[0]
    },
    body: JSON.stringify({ content: entryText })
  });

  const resJson = await res.json();
  console.log('POST Response status:', res.status);
  console.log('POST Response body:', resJson);

  if (resJson.success && resJson.entry) {
    const entryId = resJson.entry.id;
    console.log(`Waiting 12 seconds for background pipeline of entry ${entryId} to finish...`);
    await new Promise(resolve => setTimeout(resolve, 12000));

    // 4. Query DB status
    const { data: updatedEntry } = await supabase
      .from('entries')
      .select('id, scoring_status, entry_type')
      .eq('id', entryId)
      .single();
    
    console.log('Updated Entry Status:', updatedEntry);

    const { data: reflection } = await supabase
      .from('reflections')
      .select('status, reflection_text')
      .eq('entry_id', entryId)
      .maybeSingle();

    console.log('Generated Reflection:', reflection);
  }
}

run();
