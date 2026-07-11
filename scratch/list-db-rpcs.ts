import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const envContent = fs.readFileSync('D:/Internship/Ingress Within/.env', 'utf8');
  const env: Record<string, string> = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > -1) {
      env[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim();
    }
  });

  const url = env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = env['SUPABASE_SERVICE_ROLE_KEY'];

  console.log(`Fetching OpenAPI spec from ${url}...`);
  const res = await fetch(`${url}/rest/v1/?apikey=${key}`);
  const spec = await res.json();
  const paths = Object.keys(spec.paths || {});
  const rpcs = paths.filter(p => p.startsWith('/rpc/'));
  
  console.log('\n=== Exposed RPC Functions ===');
  rpcs.forEach(p => console.log(p));
}

main().catch(console.error);
