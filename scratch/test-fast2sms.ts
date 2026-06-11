import fs from 'fs';
import path from 'path';

// Parse .env manually from current working directory
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

const apiKey = process.env.FAST2SMS_API_KEY || '';
const route = process.env.FAST2SMS_ROUTE || 'otp';
const senderId = process.env.FAST2SMS_SENDER_ID || '';
const testPhone = '9876543210'; // Replace or use default

console.log('Diagnostic Test: Fast2SMS Gateway');
console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
console.log('Route:', route);
console.log('Sender ID:', senderId);

if (!apiKey) {
  console.error('Error: FAST2SMS_API_KEY is missing!');
  process.exit(1);
}

async function testFast2SMS() {
  try {
    const payload: any = {
      route: route,
      variables_values: '123456',
      numbers: testPhone
    };

    if (route === 'dlt') {
      payload.sender_id = senderId || 'INGWRT';
      payload.message = process.env.FAST2SMS_DLT_TEMPLATE_ID || '142857';
    }

    console.log('\nSending request to Fast2SMS bulkV2...');
    console.log('Payload:', payload);

    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('HTTP Status:', response.status);
    const data = await response.json() as any;
    console.log('Response Body:', data);

  } catch (error: any) {
    console.error('Fast2SMS Test Error:', error.message);
  }
}

testFast2SMS();
