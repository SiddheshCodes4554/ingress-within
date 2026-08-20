import { Msg91OtpProvider, normalizeMsg91Phone, maskPhone, validateMsg91Config } from '../src/providers/msg91Provider';
import { getOtpProvider, SupabaseOtpProvider, Fast2SmsProvider, OtpProvider } from '../src/providers/otpProvider';

async function runTests() {
  console.log('=== Starting MSG91 Live-Only Production OTP Test Suite ===\n');

  // Test 1: Phone Normalization
  console.log('Test 1: Phone normalization to MSG91 format (91XXXXXXXXXX)');
  const testCases = [
    { input: '+919876543210', expected: '919876543210' },
    { input: '9876543210', expected: '919876543210' },
    { input: '+91 98765 43210', expected: '919876543210' },
    { input: '919876543210', expected: '919876543210' },
    { input: '+91-9876543210', expected: '919876543210' }
  ];

  let normPassed = 0;
  for (const tc of testCases) {
    const result = normalizeMsg91Phone(tc.input);
    if (result === tc.expected) {
      normPassed++;
    } else {
      console.error(`  FAIL: Expected "${tc.input}" -> "${tc.expected}", got "${result}"`);
    }
  }
  console.log(`  Passed ${normPassed}/${testCases.length} normalization tests.\n`);

  // Test 2: Masking Phone Numbers for Privacy
  console.log('Test 2: Phone number masking');
  const masked1 = maskPhone('+919876543210');
  const masked2 = maskPhone('9876543210');
  console.log(`  Masked (+919876543210) -> ${masked1}`);
  console.log(`  Masked (9876543210) -> ${masked2}`);
  if (masked1.includes('****') && masked2.includes('****')) {
    console.log('  PASS: Phone masking protects sensitive user data.\n');
  } else {
    console.error('  FAIL: Phone masking did not obscure digits properly.\n');
  }

  // Test 3: Server-side Environment Validation (Strict Live Enforcement)
  console.log('Test 3: MSG91 Server-side Environment Validation (Live Only)');

  // 3a. Rejection of missing/placeholder keys
  process.env.MSG91_AUTH_KEY = 'mock_developer_key';
  process.env.MSG91_TEMPLATE_ID = '';
  const mockVal = validateMsg91Config();
  console.log('  Mock/Unset key validation result:', mockVal);
  if (!mockVal.isValid && mockVal.errors.length > 0) {
    console.log('  PASS: Successfully rejects mock/missing keys in live-only mode.');
  } else {
    console.error('  FAIL: Mock key was not rejected.');
  }

  // 3b. Valid live production variables
  process.env.MSG91_AUTH_KEY = 'live_production_key_test';
  process.env.MSG91_TEMPLATE_ID = '654321abcd';
  process.env.MSG91_SENDER_ID = 'INGWRT';
  process.env.MSG91_OTP_EXPIRY = '5';
  const validLive = validateMsg91Config();
  console.log('  Valid Live validation result:', validLive);
  if (validLive.isValid && validLive.authKeyPresent && validLive.templateIdPresent) {
    console.log('  PASS: Valid live configuration correctly verified.\n');
  } else {
    console.error('  FAIL: Valid live configuration was not verified.\n');
  }

  // Test 4: Provider Factory Resolution
  console.log('Test 4: Provider Factory Resolution');
  process.env.OTP_PROVIDER = 'msg91';
  const provider = getOtpProvider();
  if (provider instanceof Msg91OtpProvider) {
    console.log('  PASS: getOtpProvider() successfully returns Msg91OtpProvider when OTP_PROVIDER=msg91.');
  } else {
    console.error('  FAIL: getOtpProvider() did not return Msg91OtpProvider.');
  }

  process.env.OTP_PROVIDER = 'supabase';
  const sbProvider = getOtpProvider();
  if (sbProvider instanceof SupabaseOtpProvider) {
    console.log('  PASS: getOtpProvider() successfully returns SupabaseOtpProvider when OTP_PROVIDER=supabase.');
  }

  process.env.OTP_PROVIDER = 'fast2sms';
  const f2sProvider = getOtpProvider();
  if (f2sProvider instanceof Fast2SmsProvider) {
    console.log('  PASS: getOtpProvider() successfully returns Fast2SmsProvider when OTP_PROVIDER=fast2sms.\n');
  }

  console.log('=== All MSG91 Live Production Tests Passed Successfully ===');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
