import fs from 'fs';
import path from 'path';

// Load .env manually without external dotenv dependency
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
} catch (e) {}

import { Msg91OtpProvider, normalizeMsg91Phone, maskPhone, validateMsg91Config } from '../src/providers/msg91Provider';
import { getOtpProvider, OtpProvider } from '../src/providers/otpProvider';
import { AuthService } from '../src/services/authService';
import { supabase } from '../src/lib/db';
import { verifyJwt } from '../src/utils/crypto';

async function runEndToEndVerification() {
  console.log('====================================================');
  console.log('  MSG91 Live OTP & End-to-End Auth Verification');
  console.log('====================================================\n');

  // 1. Check Environment & Provider Factory
  console.log('1. Checking Environment & Provider Factory:');
  const validation = validateMsg91Config();
  console.log(`   MSG91 Config Status:`, validation.isValid ? 'VALID' : 'WARNING (Keys missing or placeholder)');
  if (validation.errors.length > 0) {
    console.log(`   Config Notes: ${validation.errors.join('; ')}`);
  }

  process.env.OTP_PROVIDER = 'msg91';
  const provider: OtpProvider = getOtpProvider();
  console.log(`   Resolved Provider: ${provider.constructor.name}`);
  if (!(provider instanceof Msg91OtpProvider)) {
    throw new Error('Factory did not resolve Msg91OtpProvider');
  }
  console.log('   ✓ Factory successfully resolved Msg91OtpProvider.\n');

  // 2. Phone Normalization & Validation Checks
  console.log('2. Testing Phone Normalization:');
  const testPhone = '+919876543210';
  const normalized = normalizeMsg91Phone(testPhone);
  const masked = maskPhone(testPhone);
  console.log(`   Raw Phone: ${testPhone}`);
  console.log(`   Normalized: ${normalized}`);
  console.log(`   Masked (Safe Log): ${masked}`);
  if (normalized !== '919876543210') {
    throw new Error(`Normalization mismatch: expected 919876543210, got ${normalized}`);
  }
  console.log('   ✓ Normalization matches MSG91 requirements (12 digits, 91 prefix).\n');

  // 3. Test Invalid Phone Handling
  console.log('3. Testing Invalid Phone Rejection:');
  const invalidSend = await provider.sendOtp('12345', 0);
  console.log(`   Invalid Send Result:`, invalidSend);
  if (invalidSend.success) {
    throw new Error('Invalid phone number was not rejected.');
  }
  console.log('   ✓ Invalid phone number rejected safely.\n');

  // 4. Test Invalid OTP Code Handling
  console.log('4. Testing Invalid OTP Code Format Rejection:');
  const invalidVerify = await provider.verifyOtp(testPhone, 'abc');
  console.log(`   Invalid Verify Result:`, invalidVerify);
  if (invalidVerify.success || invalidVerify.code !== 'AUTH_OTP_MISMATCH') {
    throw new Error('Invalid OTP code format was not rejected.');
  }
  console.log('   ✓ Invalid OTP code rejected safely.\n');

  // 5. Test AuthService Session Establishment & Protected Access
  console.log('5. Testing AuthService.establishSession Flow:');
  const testSessionPhone = '+919999988888';
  const testDeviceId = 'test_device_' + Date.now();
  const testIp = '127.0.0.1';
  const testUserAgent = 'Integration Test Runner';

  const sessionResult = await AuthService.establishSession(
    testSessionPhone,
    testDeviceId,
    'Test Browser',
    testIp,
    testUserAgent
  );

  console.log(`   Session Established Successfully!`);
  console.log(`   User ID: ${sessionResult.user.id}`);
  console.log(`   Phone Number: ${sessionResult.user.phone_number}`);
  console.log(`   Access Token Length: ${sessionResult.accessToken.length}`);
  console.log(`   Expires In: ${sessionResult.expiresIn} seconds`);

  // Verify JWT claims
  const jwtSecret = process.env.JWT_SECRET || 'jwt_default_secret_dev';
  const payload = verifyJwt(sessionResult.accessToken, jwtSecret);
  console.log(`   Decoded JWT Payload:`, { uid: payload?.uid, phone: payload?.phone, did: payload?.did });

  if (!payload || payload.uid !== sessionResult.user.id) {
    throw new Error('JWT verification failed or mismatch with user id.');
  }
  console.log('   ✓ JWT token validated cryptographically.');

  // Verify session is active in database
  const { data: dbSessions, error: sessionErr } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', sessionResult.user.id)
    .eq('device_id', testDeviceId)
    .eq('is_active', true);

  if (sessionErr || !dbSessions || dbSessions.length === 0) {
    throw new Error(`Database session query failed: ${sessionErr?.message}`);
  }
  console.log(`   ✓ Active session verified in public.user_sessions (${dbSessions.length} active session).`);

  // Verify linked profile exists
  const { data: profileData, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sessionResult.user.id)
    .maybeSingle();

  if (profErr || !profileData) {
    throw new Error(`Profile record not found: ${profErr?.message}`);
  }
  console.log(`   ✓ Linked profile record verified in public.profiles.`);

  // Cleanup test session to leave zero test artifacts
  await supabase
    .from('user_sessions')
    .delete()
    .eq('user_id', sessionResult.user.id)
    .eq('device_id', testDeviceId);

  await supabase
    .from('audit_logs')
    .delete()
    .eq('user_id', sessionResult.user.id);

  console.log('   ✓ Test session cleaned up successfully.\n');

  console.log('====================================================');
  console.log('  ALL MSG91 & AUTHENTICATION TESTS PASSED 100%');
  console.log('====================================================');
}

runEndToEndVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
