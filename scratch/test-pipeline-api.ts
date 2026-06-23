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

(process.env as any).NODE_ENV = 'development';
process.env.BYPASS_REDIS = 'true';


async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Fetching a user...');
  const { data: users } = await supabase.from('users').select('id').limit(1);
  const userId = users?.[0]?.id;
  if (!userId) {
    console.error('No users found in database.');
    return;
  }

  // We will call the API handler directly if possible, or simulate it.
  // Since we want to test the actual route endpoint behavior, let's call the POST function.
  // Wait, we can import the POST function directly from src/app/api/test-pipeline/route.ts!
  const { POST } = await import('../src/app/api/test-pipeline/route');
  
  // Construct a mock Request object
  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
      headers: {
        get: (name: string) => null
      }
    } as any;
  };

  console.log('1. Triggering run-full action...');
  const res1 = await POST(createMockRequest({
    action: 'run-full',
    newEntryText: 'Today was a tough day. I felt quite anxious about the presentation, but overall it went okay. I am glad it is over.',
    user_id: userId,
    provider: 'groq'
  }));

  const data1 = await res1.json();
  console.log('run-full response:', JSON.stringify(data1, null, 2));

  if (!data1.entryId) {
    console.error('Failed to get entryId from run-full.');
    return;
  }

  console.log('\n2. Polling job-status action...');
  for (let i = 1; i <= 5; i++) {
    console.log(`Poll attempt ${i}...`);
    const res2 = await POST(createMockRequest({
      action: 'job-status',
      entryId: data1.entryId
    }));
    const data2 = await res2.json();
    console.log(`Poll ${i} response keys:`, Object.keys(data2));
    console.log('Jobs status:', JSON.stringify(data2.jobs, null, 2));
    console.log('reflectionState:', JSON.stringify(data2.reflectionState, null, 2));
    console.log('vocabState:', JSON.stringify(data2.vocabState, null, 2));
    
    if (data2.jobs && data2.jobs.reflection.status === 'COMPLETED') {
      console.log('Reflection completed polling.');
    }
    // Sleep for 1s
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

run();
