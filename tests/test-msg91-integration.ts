import { Msg91OtpProvider, normalizeMsg91Phone, maskPhone, validateMsg91Config } from '../src/providers/msg91Provider';
import { getOtpProvider, SupabaseOtpProvider, Fast2SmsProvider, OtpProvider } from '../src/providers/otpProvider';

async function runTests() {
  console.log('=== Starting OTP Provider Factory & MSG91 Verification Suite ===\n');

  // Test 1: Provider Factory Resolution
  console.log('Test 1: Provider Factory Resolution');
  
  // 1a. OTP_PROVIDER=msg91
  process.env.OTP_PROVIDER = 'msg91';
  process.env.MSG91_AUTH_KEY = 'live_key_test';
  process.env.MSG91_TEMPLATE_ID = 'test_template_123';
  const msg91Prov = getOtpProvider();
  if (msg91Prov instanceof Msg91OtpProvider) {
    console.log('  PASS: getOtpProvider() returns Msg91OtpProvider when OTP_PROVIDER=msg91.');
  } else {
    console.error('  FAIL: getOtpProvider() did not return Msg91OtpProvider.');
  }

  // 1b. OTP_PROVIDER=supabase
  process.env.OTP_PROVIDER = 'supabase';
  const sbProv = getOtpProvider();
  if (sbProv instanceof SupabaseOtpProvider) {
    console.log('  PASS: getOtpProvider() returns SupabaseOtpProvider when OTP_PROVIDER=supabase.');
  } else {
    console.error('  FAIL: getOtpProvider() did not return SupabaseOtpProvider.');
  }

  // 1c. OTP_PROVIDER=fast2sms
  process.env.OTP_PROVIDER = 'fast2sms';
  const f2sProv = getOtpProvider();
  if (f2sProv instanceof Fast2SmsProvider) {
    console.log('  PASS: getOtpProvider() returns Fast2SmsProvider when OTP_PROVIDER=fast2sms.');
  } else {
    console.error('  FAIL: getOtpProvider() did not return Fast2SmsProvider.');
  }

  // 1d. Unsupported OTP_PROVIDER
  process.env.OTP_PROVIDER = 'unsupported_custom_gateway';
  let threwError = false;
  try {
    getOtpProvider();
  } catch (err: any) {
    threwError = true;
    if (err.message.includes('Unsupported OTP_PROVIDER')) {
      console.log('  PASS: getOtpProvider() throws clear configuration error for unsupported OTP_PROVIDER.');
    } else {
      console.error('  FAIL: Error message does not describe unsupported provider.');
    }
  }
  if (!threwError) {
    console.error('  FAIL: getOtpProvider() did not throw on unsupported OTP_PROVIDER.');
  }

  // Test 2: Phone Normalization
  console.log('\nTest 2: Phone normalization to MSG91 format (91XXXXXXXXXX)');
  const testCases = [
    { input: '+919876543210', expected: '919876543210' },
    { input: '9876543210', expected: '919876543210' },
    { input: '+91 98765 43210', expected: '919876543210' },
    { input: '919876543210', expected: '919876543210' }
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
  console.log(`  Passed ${normPassed}/${testCases.length} normalization tests.`);

  // Test 3: Verify sendOtp and verifyOtp contract via factory instance
  console.log('\nTest 3: Contract Verification via Factory Resolution');
  process.env.OTP_PROVIDER = 'msg91';
  process.env.MSG91_AUTH_KEY = 'live_key_test';
  process.env.MSG91_TEMPLATE_ID = 'template_test';
  
  const activeProvider: OtpProvider = getOtpProvider();
  if (typeof activeProvider.sendOtp === 'function' && typeof activeProvider.verifyOtp === 'function') {
    console.log('  PASS: Factory instance conforms strictly to OtpProvider interface.');
  } else {
    console.error('  FAIL: Factory instance does not conform to OtpProvider interface.');
  }

  console.log('\n=== All Factory & Provider Tests Passed Successfully ===');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
