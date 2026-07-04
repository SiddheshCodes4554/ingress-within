import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

// 1. Load .env file
try {
  const envContent = fs.readFileSync('D:/Internship/Ingress Within/.env', 'utf8');
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

process.env.BYPASS_REDIS = 'true';

async function runTests() {
  console.log('=== MULTI-TENANT VERSION-AWARE MIGRATIONS VERIFICATION ===\n');

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  const { signJwt } = await import('../src/utils/crypto');
  const { GET: getVocabOverview } = await import('../src/app/api/vocab/overview/route');
  const { GET: getWeeklyReports } = await import('../src/app/api/reports/weekly/route');
  const { GET: getAssessment } = await import('../src/app/api/reports/assessment/route');
  const { GET: getPatterns } = await import('../src/app/api/patterns/route');

  // Find a test user
  const { data: users } = await supabase.from('users').select('id').limit(1);
  if (!users || users.length === 0) {
    throw new Error('No users found in database.');
  }
  const testUserId = users[0].id;
  console.log(`Test User ID: ${testUserId}`);

  // Create active session in DB for JWT validation
  const deviceId = 'test-migration-device';
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
  
  await supabase.from('user_sessions').delete().eq('user_id', testUserId).eq('device_id', deviceId);
  const { error: sessionInsertErr } = await supabase.from('user_sessions').insert({
    user_id: testUserId,
    device_id: deviceId,
    device_name: 'Test Runner',
    ip_address: '127.0.0.1',
    user_agent: 'TestAgent',
    is_active: true,
    expires_at: expiresAt,
    refresh_token_hash: 'test_refresh_hash_' + Math.random().toString(36).substring(2)
  });

  if (sessionInsertErr) {
    throw new Error(`Failed to create test session: ${sessionInsertErr.message}`);
  }

  // Generate JWT token
  const secret = process.env.JWT_SECRET || 'jwt_default_secret_dev';
  const token = signJwt({
    uid: testUserId,
    phone: '1234567890',
    did: deviceId
  }, secret, 3600);

  // Clean up user_intelligence_versions for the test user to simulate a fresh/un-migrated user
  await supabase.from('user_intelligence_versions').delete().eq('user_id', testUserId);

  console.log('\n--- TEST 1: Requesting Vocab Overview (Triggers Rebuild) ---');
  // Construct request with Authorization header
  const req1 = new NextRequest('http://localhost:3000/api/vocab/overview', {
    headers: {
      'authorization': `Bearer ${token}`
    }
  });

  const res1 = await getVocabOverview(req1);
  console.log(`Status code: ${res1.status}`);
  const data1 = await res1.json();
  console.log(`Response success:`, data1.success);
  if (res1.status !== 200) {
    throw new Error(`Expected status 200, got ${res1.status}. Body: ${JSON.stringify(data1)}`);
  }

  // Verify that the version table was updated to 2.0 (since BYPASS_REDIS is true, the rebuild executes inline)
  const { data: userVersions } = await supabase
    .from('user_intelligence_versions')
    .select('*')
    .eq('user_id', testUserId)
    .single();

  console.log('User Intelligence Versions:', userVersions);
  if (userVersions?.vocab_engine_version !== '2.0') {
    throw new Error('Vocabulary engine version was not updated to 2.0!');
  }
  console.log('PASS: Vocab background rebuild triggered and completed successfully.');

  console.log('\n--- TEST 2: Requesting Weekly Reports (Triggers Reports Rebuild) ---');
  const req2 = new NextRequest('http://localhost:3000/api/reports/weekly', {
    headers: {
      'authorization': `Bearer ${token}`
    }
  });

  const res2 = await getWeeklyReports(req2);
  console.log(`Status code: ${res2.status}`);
  const data2 = await res2.json();
  console.log(`Response success:`, data2.success);

  const { data: userVersionsAfterReports } = await supabase
    .from('user_intelligence_versions')
    .select('*')
    .eq('user_id', testUserId)
    .single();

  console.log('User Intelligence Versions:', userVersionsAfterReports);
  if (userVersionsAfterReports?.reports_engine_version !== '2.0') {
    throw new Error('Reports engine version was not updated to 2.0!');
  }
  console.log('PASS: Reports background rebuild triggered and completed successfully.');

  console.log('\n--- TEST 3: Requesting Patterns (Triggers Patterns Rebuild & Seeds Default Patterns) ---');
  const req3 = new NextRequest('http://localhost:3000/api/patterns', {
    headers: {
      'authorization': `Bearer ${token}`
    }
  });

  // Ensure user has an active cycle for seeding
  const { data: cycles } = await supabase.from('cycles').select('id').eq('user_id', testUserId).eq('status', 'ACTIVE');
  if (!cycles || cycles.length === 0) {
    // Insert a dummy active cycle for patterns seeding
    await supabase.from('cycles').insert({
      user_id: testUserId,
      status: 'ACTIVE',
      cycle_number: 1,
      total_days: 30
    });
  }

  const res3 = await getPatterns(req3);
  console.log(`Status code: ${res3.status}`);
  const data3 = await res3.json();
  console.log(`Response success:`, data3.success);
  console.log(`Patterns returned:`, data3.patterns?.length);

  const { data: userVersionsAfterPatterns } = await supabase
    .from('user_intelligence_versions')
    .select('*')
    .eq('user_id', testUserId)
    .single();

  console.log('User Intelligence Versions:', userVersionsAfterPatterns);
  if (userVersionsAfterPatterns?.patterns_engine_version !== '1.0') {
    throw new Error('Patterns engine version was not updated to 1.0!');
  }

  const { data: seededPatterns } = await supabase
    .from('patterns')
    .select('id, name')
    .eq('user_id', testUserId);

  console.log(`Seeded Patterns in Database:`, seededPatterns?.map(p => p.name));
  if (!seededPatterns || seededPatterns.length === 0) {
    throw new Error('Failed to seed default patterns!');
  }
  console.log('PASS: Patterns background rebuild triggered, completed, and seeded successfully.');

  // Cleanup test data
  console.log('\nCleaning up test session, versions, and seeded patterns...');
  await supabase.from('user_sessions').delete().eq('user_id', testUserId).eq('device_id', deviceId);
  await supabase.from('user_intelligence_versions').delete().eq('user_id', testUserId);
  await supabase.from('patterns').delete().eq('user_id', testUserId);

  console.log('\nAll Multi-Tenant Version Migrations checks passed successfully!');
}

runTests().catch(console.error);
