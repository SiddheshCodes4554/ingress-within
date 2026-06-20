import fs from 'fs';
import path from 'path';

try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
  const keys = envContent.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return null;
    const eqIdx = trimmed.indexOf('=');
    return eqIdx > -1 ? trimmed.substring(0, eqIdx).trim() : null;
  }).filter(Boolean);
  console.log('Env keys:', keys);
} catch (e: any) {
  console.error('Could not read .env file:', e.message);
}
