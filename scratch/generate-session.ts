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

import { signJwt } from '../src/utils/crypto';

const userId = '10000000-0000-4000-b000-000000000002';
const phoneNumber = '+918989898989';
const deviceId = 'manual_session_device_id_2';
const jwtSecret = process.env.JWT_SECRET || 'jwt_default_secret_dev';

const token = signJwt(
  {
    uid: userId,
    phone: phoneNumber,
    did: deviceId
  },
  jwtSecret,
  30 * 24 * 60 * 60 // 30 days
);

console.log('=== ACCESS TOKEN ===');
console.log(token);
console.log('\n=== BROWSER CONSOLE LOGIN COMMAND ===');
console.log(`document.cookie = "iw-access=${token}; path=/; max-age=2592000"; window.location.href = "/dashboard";`);
