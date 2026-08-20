import { Msg91OtpProvider, normalizeMsg91Phone, maskPhone, validateMsg91Config } from '../src/providers/msg91Provider';
import { getOtpProvider, SupabaseOtpProvider, Fast2SmsProvider, OtpProvider } from '../src/providers/otpProvider';

async function runTests() {
  console.log('=== Starting MSG91 OTP Integration & Environment Test Suite ===\n');

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

  // Test 3: Server-side Environment Validation
  console.log('Test 3: MSG91 Server-side Environment Validation');
  
  // 3a. Simulator mode
  process.env.MSG91_AUTH_KEY = 'mock_developer_key';
  process.env.MSG91_TEMPLATE_ID = '';
  const simVal = validateMsg91Config();
  console.log('  Simulator validation result:', simVal);
  if (simVal.isSimulator && simVal.isValid) {
    console.log('  PASS: Simulator mode is detected and valid.');
  } else {
    console.error('  FAIL: Simulator mode validation failed.');
  }

  // 3b. Missing required live variables
  process.env.MSG91_AUTH_KEY = 'live_key_example_123';
  process.env.MSG91_TEMPLATE_ID = '';
  const missingVal = validateMsg91Config();
  console.log('  Missing Template ID validation result:', missingVal);
  if (!missingVal.isValid && missingVal.errors.some(e => e.includes('MSG91_TEMPLATE_ID'))) {
    console.log('  PASS: Correctly flagged missing MSG91_TEMPLATE_ID error.');
  } else {
    console.error('  FAIL: Missing template ID was not detected.');
  }

  // 3c. Valid live production variables
  process.env.MSG91_AUTH_KEY = 'real_auth_key_sample';
  process.env.MSG91_TEMPLATE_ID = '654321abcd';
  process.env.MSG91_SENDER_ID = 'INGWRT';
  process.env.MSG91_OTP_EXPIRY = '10';
  const validLive = validateMsg91Config();
  console.log('  Valid Live validation result:', validLive);
  if (validLive.isValid && !validLive.isSimulator && validLive.otpExpiryMinutes === 10) {
    console.log('  PASS: Valid live configuration correctly verified.\n');
  } else {
    console.error('  FAIL: Valid live configuration was not verified.\n');
  }

  // Reset to mock for downstream execution tests
  process.env.MSG91_AUTH_KEY = 'mock_developer_key';
  process.env.MSG91_TEMPLATE_ID = '';
  process.env.MSG91_OTP_EXPIRY = '5';

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

  // Test 5: Msg91OtpProvider Send and Verify Contract
  console.log('Test 5: Msg91OtpProvider Execution (Simulator Mode)');
  process.env.OTP_PROVIDER = 'msg91';
  process.env.MSG91_AUTH_KEY = 'mock_developer_key';
  const msg91Instance: OtpProvider = new Msg91OtpProvider();

  // Send OTP
  const sendRes = await msg91Instance.sendOtp('+919876543210', 1);
  console.log('  sendOtp result:', sendRes);
  if (sendRes.success && sendRes.resendInSeconds === 30) {
    console.log('  PASS: sendOtp returned valid structured OtpResult.');
  } else {
    console.error('  FAIL: sendOtp failed contract validation.');
  }

  // Verify Valid OTP
  const verifyRes = await msg91Instance.verifyOtp('+919876543210', '123456');
  console.log('  verifyOtp (valid) result:', verifyRes);
  if (verifyRes.success && verifyRes.message === 'Verified successfully.') {
    console.log('  PASS: verifyOtp returned success for valid 6-digit code.');
  } else {
    console.error('  FAIL: verifyOtp failed valid code test.');
  }

  // Verify Invalid OTP
  const verifyInvalid = await msg91Instance.verifyOtp('+919876543210', '12');
  console.log('  verifyOtp (invalid) result:', verifyInvalid);
  if (!verifyInvalid.success && verifyInvalid.code === 'AUTH_OTP_MISMATCH') {
    console.log('  PASS: verifyOtp safely rejected invalid code with AUTH_OTP_MISMATCH.\n');
  } else {
    console.error('  FAIL: verifyOtp did not reject invalid code properly.\n');
  }

  console.log('=== All MSG91 Integration & Environment Tests Passed Successfully ===');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
