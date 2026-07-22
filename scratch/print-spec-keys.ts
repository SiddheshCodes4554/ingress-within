import fs from 'fs';
import path from 'path';

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

  const res = await fetch(`${url}/rest/v1/?apikey=${key}`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const spec = await res.json();
  console.log('Path count:', Object.keys(spec.paths || {}).length);
  console.log('Paths:', Object.keys(spec.paths || {}));
}

main().catch(console.error);
