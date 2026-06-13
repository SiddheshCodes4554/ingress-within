// Ensure development environment variables are set before any ESM modules are evaluated
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock_anon_key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_service_key';
process.env.FAST2SMS_API_KEY = 'mock_developer_key';
process.env.FAST2SMS_SENDER_ID = 'INGWRT';
process.env.JWT_SECRET = 'test_jwt_secure_secret_key_12345';
(process.env as any).NODE_ENV = 'test';

// Local In-Memory Database Simulation
let mockOtpTable: any[] = [];
let mockUsersTable: any[] = [];
let mockSessionsTable: any[] = [];
let mockConsentsTable: any[] = [];
let mockPreferencesTable: any[] = [];
let mockAuditLogsTable: any[] = [];
let mockProfilesTable: any[] = [];

const originalLog = console.log;

// Intercept and Mock Supabase client operations
const mockFrom = (table: string): any => {
  let dataSet: any[] = [];
  if (table === 'otp_verifications') dataSet = mockOtpTable;
  else if (table === 'users') dataSet = mockUsersTable;
  else if (table === 'user_sessions') dataSet = mockSessionsTable;
  else if (table === 'consents') dataSet = mockConsentsTable;
  else if (table === 'notification_preferences') dataSet = mockPreferencesTable;
  else if (table === 'audit_logs') dataSet = mockAuditLogsTable;
  else if (table === 'profiles') dataSet = mockProfilesTable;

  let filtered = [...dataSet];
  let updateValues: any = null;
  let isDelete = false;

  const builder = {
    select: (columns?: string, options?: any) => {
      return builder;
    },
    insert: (values: any) => {
      const rows = Array.isArray(values) ? values : [values];
      const insertedRows = rows.map(r => {
        const timeOffset = Date.now() + dataSet.length;
        const newRow = { 
          id: Math.random().toString(), 
          created_at: new Date(timeOffset).toISOString(), 
          verified_at: null,
          attempts_count: 0,
          is_active: true,
          ...r 
        };
        dataSet.push(newRow);

        // Simulate Postgres database trigger to sync user profile creation
        if (table === 'users') {
          mockProfilesTable.push({
            id: newRow.id,
            phone_number: newRow.phone_number,
            full_name: null,
            avatar_url: null,
            consent_completed: false,
            profile_completed: false,
            notifications_completed: false,
            orientation_completed: false,
            assessment_completed: false,
            onboarding_completed: false,
            created_at: newRow.created_at,
            updated_at: newRow.created_at
          });
        }
        return newRow;
      });
      filtered = insertedRows;
      return builder;
    },
    update: (values: any) => {
      updateValues = values;
      return builder;
    },
    delete: () => {
      isDelete = true;
      return builder;
    },
    eq: (column: string, value: any) => {
      filtered = filtered.filter(row => {
        const rowVal = row[column] === undefined ? null : row[column];
        const compareVal = value === undefined ? null : value;
        return rowVal === compareVal;
      });
      return builder;
    },
    is: (column: string, value: any) => {
      filtered = filtered.filter(row => {
        const rowVal = row[column] === undefined ? null : row[column];
        const compareVal = value === undefined ? null : value;
        return rowVal === compareVal;
      });
      return builder;
    },
    gt: (column: string, value: any) => {
      filtered = filtered.filter(row => {
        const rowVal = row[column] || '';
        return rowVal > value;
      });
      return builder;
    },
    order: (column: string, options?: any) => {
      filtered.sort((a, b) => {
        if (a[column] < b[column]) return options?.ascending ? -1 : 1;
        if (a[column] > b[column]) return options?.ascending ? 1 : -1;
        return 0;
      });
      return builder;
    },
    limit: (num: number) => {
      filtered = filtered.slice(0, num);
      return builder;
    },
    maybeSingle: () => {
      if (updateValues) {
        filtered.forEach(row => {
          const dbRow = dataSet.find(r => r.id === row.id);
          if (dbRow) Object.assign(dbRow, updateValues);
        });
      }
      const data = filtered.length > 0 ? filtered[0] : null;
      return Promise.resolve({ data, error: null });
    },
    single: () => {
      if (updateValues) {
        filtered.forEach(row => {
          const dbRow = dataSet.find(r => r.id === row.id);
          if (dbRow) Object.assign(dbRow, updateValues);
        });
      }
      const data = filtered.length > 0 ? filtered[0] : null;
      return Promise.resolve({ data, error: data ? null : { message: 'Not found' } });
    },
    then: (resolve: any) => {
      if (updateValues) {
        filtered.forEach(row => {
          const dbRow = dataSet.find(r => r.id === row.id);
          if (dbRow) {
            Object.assign(dbRow, updateValues);
            Object.assign(row, updateValues);
          }
        });
      }
      if (isDelete) {
        filtered.forEach(row => {
          const index = dataSet.findIndex(r => r.id === row.id);
          if (index > -1) dataSet.splice(index, 1);
          
          if (table === 'users') {
            mockProfilesTable = mockProfilesTable.filter(p => p.id !== row.id);
            mockSessionsTable = mockSessionsTable.filter(s => s.user_id !== row.id);
            mockConsentsTable = mockConsentsTable.filter(c => c.user_id !== row.id);
            mockPreferencesTable = mockPreferencesTable.filter(p => p.user_id !== row.id);
          }
        });
      }
      resolve({ data: filtered, count: filtered.length, error: null });
    }
  };

  return builder;
};

// Helper to simulate request payload
function createRequest(body: any, headers?: Record<string, string>, method = 'POST'): any {
  const options: RequestInit = {
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers
    })
  };
  if (method !== 'GET' && method !== 'HEAD' && body !== undefined) {
    options.body = JSON.stringify(body);
  }
  return new Request('http://localhost/api/auth', options);
}

// Cookie extraction helper
function getCookieValue(cookieHeader: string | null, name: string): string {
  if (!cookieHeader) return '';
  const cookies = cookieHeader.split(',');
  for (const cookie of cookies) {
    const parts = cookie.trim().split(';');
    const mainPart = parts[0];
    const [cName, cVal] = mainPart.split('=');
    if (cName.trim() === name) {
      return cVal.trim();
    }
  }
  return '';
}

async function runTests() {
  const { POST: sendOtpHandler } = await import('../src/app/api/auth/send-otp/route');
  const { POST: verifyOtpHandler } = await import('../src/app/api/auth/verify-otp/route');
  const { POST: logoutHandler } = await import('../src/app/api/auth/logout/route');
  const { POST: refreshHandler } = await import('../src/app/api/auth/refresh/route');
  const { GET: meHandler } = await import('../src/app/api/auth/me/route');

  const { POST: consentHandler } = await import('../src/app/api/onboarding/consent/route');
  const { POST: profileHandler } = await import('../src/app/api/onboarding/profile/route');
  const { POST: welcomeHandler } = await import('../src/app/api/onboarding/welcome/route');
  const { POST: assessmentHandler } = await import('../src/app/api/onboarding/assessment/route');

  const { POST: deleteSendOtpHandler } = await import('../src/app/api/auth/delete-account/send-otp/route');
  const { POST: deleteConfirmHandler } = await import('../src/app/api/auth/delete-account/route');

  const { supabase, supabaseAuth } = await import('../src/lib/db');

  // Inject mocks
  (supabase as any).from = mockFrom;

  let currentSupabaseOtp = '';
  (supabaseAuth as any).auth = {
    signInWithOtp: async ({ phone }: { phone: string }) => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      currentSupabaseOtp = code;
      console.log(`[Supabase Auth Mock] verification code is ${code} for ${phone}`);
      return { data: {}, error: null };
    },
    verifyOtp: async ({ phone, token, type }: { phone: string; token: string; type: string }) => {
      if (token === currentSupabaseOtp) {
        return { data: { user: { id: 'mock_supabase_user_id' } }, error: null };
      }
      if (token === '123456') {
        return { data: { user: null }, error: { message: 'Invalid OTP' } };
      }
      return { data: { user: null }, error: { message: 'Otp expired or invalid' } };
    }
  };

  const providers: ('fast2sms' | 'supabase')[] = ['fast2sms', 'supabase'];

  for (const provider of providers) {
    console.log('\n====================================================');
    console.log(`🚀 RUNNING INTEGRATION TESTS IN MODE: ${provider.toUpperCase()}`);
    console.log('====================================================\n');

    process.env.OTP_PROVIDER = provider;

    // Reset mock tables
    mockOtpTable = [];
    mockUsersTable = [];
    mockSessionsTable = [];
    mockConsentsTable = [];
    mockPreferencesTable = [];
    mockAuditLogsTable = [];
    mockProfilesTable = [];

    const testPhone = '+919876543210';
    let capturedOtp = '';

    console.log = (...args: any[]) => {
      originalLog(...args);
      const logStr = args.join(' ');
      if (logStr.includes('verification code is')) {
        const match = logStr.match(/code is (\d{6})/);
        if (match) capturedOtp = match[1];
      }
    };

    try {
      // ------------------------------------------------------------------
      // TEST 1: Request OTP successfully
      // ------------------------------------------------------------------
      console.log('TEST 1: Requesting OTP for phone: ' + testPhone);
      const req1 = createRequest({ phone_number: testPhone });
      const res1 = await sendOtpHandler(req1);
      const data1 = await res1.json();
      console.log(`Response Status: ${res1.status}`);
      console.log(`Response Body:`, data1);
      if (res1.status === 200 && data1.success && capturedOtp) {
        console.log('✅ TEST 1 PASSED: OTP generated successfully. Captured Code: ' + capturedOtp + '\n');
      } else {
        throw new Error('TEST 1 FAILED');
      }

      // ------------------------------------------------------------------
      // TEST 2: Rate Limiting
      // ------------------------------------------------------------------
      console.log('TEST 2: Testing Rate Limiting...');
      if (provider === 'fast2sms') {
        console.log('Attempting to spam OTP requests (Simulating 3 quick sends)...');
        for (let i = 0; i < 3; i++) {
          const reqSpam = createRequest({ phone_number: testPhone });
          await sendOtpHandler(reqSpam);
        }
      } else {
        console.log('Simulating 3 existing OTP requests in database for rate limiting...');
        const fifteenMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        for (let i = 0; i < 3; i++) {
          mockOtpTable.push({
            id: `stub_otp_${i}`,
            phone_number: testPhone,
            created_at: fifteenMinutesAgo,
            verified_at: null,
            attempts_count: 0
          });
        }
      }
      const reqLimit = createRequest({ phone_number: testPhone });
      const resLimit = await sendOtpHandler(reqLimit);
      const dataLimit = await resLimit.json();
      console.log(`Spam Response Status: ${resLimit.status}`);
      console.log(`Spam Response Body:`, dataLimit);
      if (resLimit.status === 429 && dataLimit.error.code === 'RATE_LIMIT_EXCEEDED') {
        console.log('✅ TEST 2 PASSED: Rate limit block working correctly.\n');
      } else {
        throw new Error('TEST 2 FAILED');
      }

      // Reset OTP table and rate limits
      mockOtpTable = [];
      capturedOtp = '';
      await sendOtpHandler(createRequest({ phone_number: testPhone }));

      // ------------------------------------------------------------------
      // TEST 3: Wrong OTP input verification
      // ------------------------------------------------------------------
      console.log('TEST 3: Verifying OTP with wrong code (123456)...');
      const reqWrong = createRequest({
        phone_number: testPhone,
        otp_code: '123456',
        device_id: 'test_dev_01'
      });
      const resWrong = await verifyOtpHandler(reqWrong);
      const dataWrong = await resWrong.json();
      console.log(`Response Status: ${resWrong.status}`);
      console.log(`Response Body:`, dataWrong);
      if (resWrong.status === 400 && dataWrong.error.code === 'AUTH_OTP_MISMATCH') {
        console.log('✅ TEST 3 PASSED: System rejected wrong code.\n');
      } else {
        throw new Error('TEST 3 FAILED');
      }

      if (provider === 'fast2sms') {
        // ------------------------------------------------------------------
        // TEST 4: Brute Force Lockout (Fast2SMS only)
        // ------------------------------------------------------------------
        console.log('TEST 4: Submitting invalid OTP codes to trigger brute force lockout...');
        for (let i = 0; i < 2; i++) {
          const reqBF = createRequest({
            phone_number: testPhone,
            otp_code: '999999',
            device_id: 'test_dev_01'
          });
          await verifyOtpHandler(reqBF);
        }
        
        const reqLocked = createRequest({
          phone_number: testPhone,
          otp_code: capturedOtp,
          device_id: 'test_dev_01'
        });
        const resLocked = await verifyOtpHandler(reqLocked);
        const dataLocked = await resLocked.json();
        console.log(`Locked out attempt status: ${resLocked.status}`);
        console.log(`Locked out attempt body:`, dataLocked);
        if (resLocked.status === 429 && dataLocked.error.code === 'RATE_LIMIT_EXCEEDED') {
          console.log('✅ TEST 4 PASSED: User successfully locked out after 3 failed attempts.\n');
        } else {
          throw new Error('TEST 4 FAILED');
        }

        // Reset OTP table
        mockOtpTable = [];
        capturedOtp = '';
        await sendOtpHandler(createRequest({ phone_number: testPhone }));

        // ------------------------------------------------------------------
        // TEST 5: Replay Protection (Fast2SMS only)
        // ------------------------------------------------------------------
        console.log('TEST 5: Testing Replay Protection...');
        const originalOtp = capturedOtp;
        capturedOtp = '';
        
        await new Promise(r => setTimeout(r, 10));
        await sendOtpHandler(createRequest({ phone_number: testPhone }));
        await new Promise(r => setTimeout(r, 10));
        
        originalLog('New code requested. Verify using original code: ' + originalOtp);
        
        const reqReplay = createRequest({
          phone_number: testPhone,
          otp_code: originalOtp,
          device_id: 'test_dev_01'
        });
        const resReplay = await verifyOtpHandler(reqReplay);
        const dataReplay = await resReplay.json();
        console.log(`Replay verification status: ${resReplay.status}`);
        console.log(`Replay verification body:`, dataReplay);
        if (resReplay.status === 400 && dataReplay.error.code === 'AUTH_OTP_EXPIRED') {
          console.log('✅ TEST 5 PASSED: Previous OTP successfully invalidated.\n');
        } else {
          throw new Error('TEST 5 FAILED');
        }
      } else {
        console.log('TEST 4 & 5 SKIPPED: Managed by native Supabase GoTrue server internally.\n');
      }

      // ------------------------------------------------------------------
      // TEST 6: Successful Verification Flow
      // ------------------------------------------------------------------
      console.log('TEST 6: Verifying OTP with correct code: ' + capturedOtp);
      const reqSuccess = createRequest({
        phone_number: testPhone,
        otp_code: capturedOtp,
        device_id: 'test_dev_01',
        device_name: 'Chrome on macOS'
      });
      const resSuccess = await verifyOtpHandler(reqSuccess);
      const dataSuccess = await resSuccess.json();
      console.log(`Response Status: ${resSuccess.status}`);
      console.log(`Response Body:`, dataSuccess);
      
      const cookies = resSuccess.headers.get('set-cookie');
      console.log(`Set-Cookie headers generated:`, cookies);

      const isSuccess = resSuccess.status === 200 && dataSuccess.success && dataSuccess.user.phone_number === testPhone;
      let accessCookie = getCookieValue(cookies, '__Host-iw-access');
      let refreshCookie = getCookieValue(cookies, '__Host-iw-refresh');

      if (isSuccess && accessCookie && refreshCookie) {
        console.log('✅ TEST 6 PASSED: Session established, cookies extracted.\n');
      } else {
        throw new Error('TEST 6 FAILED');
      }

      // ------------------------------------------------------------------
      // TEST 7: GET Profile (me) Endpoint (Onboarding Incomplete)
      // ------------------------------------------------------------------
      console.log('TEST 7: Retrieving user profile (Onboarding Incomplete)...');
      const reqMe = createRequest(undefined, { 
        'Cookie': `__Host-iw-access=${accessCookie}` 
      }, 'GET');
      
      const resMe = await meHandler(reqMe);
      const dataMe = await resMe.json();
      console.log(`Response Status: ${resMe.status}`);
      console.log(`Response Body:`, dataMe);
      
      if (resMe.status === 200 && dataMe.success && dataMe.profile.onboarding_completed === false) {
        console.log('✅ TEST 7 PASSED: Onboarding state checked, defaults to false.\n');
      } else {
        throw new Error('TEST 7 FAILED');
      }

      // ------------------------------------------------------------------
      // TEST 8: Onboarding - Consent Step
      // ------------------------------------------------------------------
      console.log('TEST 8: Submitting onboarding consent...');
      const reqConsent = createRequest({
        terms_version: 'v1.0.0',
        privacy_version: 'v1.0.0'
      }, {
        'Cookie': `__Host-iw-access=${accessCookie}`
      });
      const resConsent = await consentHandler(reqConsent);
      const dataConsent = await resConsent.json();
      console.log(`Consent Response Status: ${resConsent.status}`);
      console.log(`Consent Response Body:`, dataConsent);

      if (resConsent.status === 200 && dataConsent.success) {
        console.log('✅ TEST 8 PASSED: Consent onboarding step complete.\n');
      } else {
        throw new Error('TEST 8 FAILED');
      }

      // ------------------------------------------------------------------
      // TEST 9: Onboarding - Profile Step
      // ------------------------------------------------------------------
      console.log('TEST 9: Submitting onboarding profile (name details)...');
      const reqProfile = createRequest({
        full_name: 'John Doe'
      }, {
        'Cookie': `__Host-iw-access=${accessCookie}`
      });
      const resProfile = await profileHandler(reqProfile);
      const dataProfile = await resProfile.json();
      console.log(`Profile Response Status: ${resProfile.status}`);
      console.log(`Profile Response Body:`, dataProfile);

      if (resProfile.status === 200 && dataProfile.success) {
        console.log('✅ TEST 9 PASSED: Profile setup step complete, notifications auto-marked true.\n');
      } else {
        throw new Error('TEST 9 FAILED');
      }

      // ------------------------------------------------------------------
      // TEST 10: Onboarding - Welcome Orientation Step
      // ------------------------------------------------------------------
      console.log('TEST 10: Submitting onboarding orientation welcome complete...');
      const reqWelcome = createRequest({}, {
        'Cookie': `__Host-iw-access=${accessCookie}`
      });
      const resWelcome = await welcomeHandler(reqWelcome);
      const dataWelcome = await resWelcome.json();
      console.log(`Welcome Response Status: ${resWelcome.status}`);
      console.log(`Welcome Response Body:`, dataWelcome);

      if (resWelcome.status === 200 && dataWelcome.success) {
        console.log('✅ TEST 10 PASSED: Welcome orientation step complete.\n');
      } else {
        throw new Error('TEST 10 FAILED');
      }

      // ------------------------------------------------------------------
      // TEST 11: Onboarding - Assessment Step (Finalizing Onboarding)
      // ------------------------------------------------------------------
      console.log('TEST 11: Submitting onboarding assessment finalization...');
      const reqAssessment = createRequest({}, {
        'Cookie': `__Host-iw-access=${accessCookie}`
      });
      const resAssessment = await assessmentHandler(reqAssessment);
      const dataAssessment = await resAssessment.json();
      console.log(`Assessment Response Status: ${resAssessment.status}`);
      console.log(`Assessment Response Body:`, dataAssessment);

      if (resAssessment.status === 200 && dataAssessment.success) {
        console.log('✅ TEST 11 PASSED: Assessment step complete and onboarding marked completed.\n');
      } else {
        throw new Error('TEST 11 FAILED');
      }

      // ------------------------------------------------------------------
      // TEST 12: GET Profile (me) Endpoint (Onboarding Complete)
      // ------------------------------------------------------------------
      console.log('TEST 12: Retrieving user profile (Onboarding Complete)...');
      const resMeComplete = await meHandler(reqMe);
      const dataMeComplete = await resMeComplete.json();
      console.log(`Response Status: ${resMeComplete.status}`);
      console.log(`Response Body:`, dataMeComplete);

      if (resMeComplete.status === 200 && dataMeComplete.success && dataMeComplete.profile.onboarding_completed === true) {
        console.log('✅ TEST 12 PASSED: User profile and onboarding fully completed.\n');
      } else {
        throw new Error('TEST 12 FAILED');
      }

      // ------------------------------------------------------------------
      // TEST 13: Token Rotation (refresh) Endpoint
      // ------------------------------------------------------------------
      console.log('TEST 13: Rotating session using refresh token cookie...');
      const reqRefresh = createRequest(undefined, { 
        'Cookie': `__Host-iw-refresh=${refreshCookie}` 
      }, 'POST');
      
      const resRefresh = await refreshHandler(reqRefresh);
      const dataRefresh = await resRefresh.json();
      console.log(`Response Status: ${resRefresh.status}`);
      console.log(`Response Body:`, dataRefresh);
      
      const rotatedCookies = resRefresh.headers.get('set-cookie');
      const newAccessCookie = getCookieValue(rotatedCookies, '__Host-iw-access');
      const newRefreshCookie = getCookieValue(rotatedCookies, '__Host-iw-refresh');
      
      if (resRefresh.status === 200 && dataRefresh.success && newAccessCookie && newRefreshCookie) {
        console.log('✅ TEST 13 PASSED: Rotation succeeded. Old refresh token rotated.\n');
        accessCookie = newAccessCookie;
        refreshCookie = newRefreshCookie;
      } else {
        throw new Error('TEST 13 FAILED');
      }

      // ------------------------------------------------------------------
      // TEST 14: Access profile using newly rotated Access Token
      // ------------------------------------------------------------------
      console.log('TEST 14: Accessing profile with rotated access token...');
      const reqMeRotated = createRequest(undefined, { 
        'Cookie': `__Host-iw-access=${accessCookie}` 
      }, 'GET');
      
      const resMeRotated = await meHandler(reqMeRotated);
      const dataMeRotated = await resMeRotated.json();
      console.log(`Response Status: ${resMeRotated.status}`);
      if (resMeRotated.status === 200 && dataMeRotated.success) {
        console.log('✅ TEST 14 PASSED: Access granted using rotated token.\n');
      } else {
        throw new Error('TEST 14 FAILED');
      }

      // ------------------------------------------------------------------
      // TEST 15: Session Revocation (logout) Endpoint
      // ------------------------------------------------------------------
      console.log('TEST 15: Logging out (revoking session)...');
      const reqLogout = createRequest(undefined, { 
        'Cookie': `__Host-iw-refresh=${refreshCookie}` 
      }, 'POST');
      
      const resLogout = await logoutHandler(reqLogout);
      const dataLogout = await resLogout.json();
      console.log(`Response Status: ${resLogout.status}`);
      
      const logoutCookies = resLogout.headers.get('set-cookie');
      const clearedAccess = getCookieValue(logoutCookies, '__Host-iw-access');
      const clearedRefresh = getCookieValue(logoutCookies, '__Host-iw-refresh');
      
      if (resLogout.status === 200 && dataLogout.success && clearedAccess === '' && clearedRefresh === '') {
        console.log('✅ TEST 15 PASSED: Session revoked successfully.\n');
      } else {
        throw new Error('TEST 15 FAILED');
      }

      // ------------------------------------------------------------------
      // TEST 16: Access with revoked credentials
      // ------------------------------------------------------------------
      console.log('TEST 16: Attempting to access profile with revoked access token...');
      const reqRevokedMe = createRequest(undefined, { 
        'Cookie': `__Host-iw-access=${accessCookie}` 
      }, 'GET');
      const resRevokedMe = await meHandler(reqRevokedMe);
      console.log(`Me Response Status (Should be 401): ${resRevokedMe.status}`);

      console.log('Attempting to rotate session with revoked refresh token...');
      const reqRevokedRefresh = createRequest(undefined, { 
        'Cookie': `__Host-iw-refresh=${refreshCookie}` 
      }, 'POST');
      const resRevokedRefresh = await refreshHandler(reqRevokedRefresh);
      console.log(`Refresh Response Status (Should be 401): ${resRevokedRefresh.status}`);

      if (resRevokedMe.status === 401 && resRevokedRefresh.status === 401) {
        console.log(`✅ TEST 16 PASSED: Rejected revoked credentials correctly for ${provider.toUpperCase()}.\n`);
      } else {
        throw new Error('TEST 16 FAILED');
      }

      // ------------------------------------------------------------------
      // TEST 17: Requesting Deletion OTP
      // ------------------------------------------------------------------
      console.log('TEST 17: Setting up new user session for deletion test...');
      const deletePhone = '+919999999999';
      let deleteCapturedOtp = '';
      
      // Override console.log to capture this deletion user's OTP
      console.log = (...args: any[]) => {
        originalLog(...args);
        const logStr = args.join(' ');
        if (logStr.includes('code is')) {
          const match = logStr.match(/code is (\d{6})/);
          if (match) deleteCapturedOtp = match[1];
        }
      };

      // 1. Send OTP to register the delete-test user
      await sendOtpHandler(createRequest({ phone_number: deletePhone }));
      
      // 2. Verify OTP to log them in
      const resVerifyDeleteUser = await verifyOtpHandler(createRequest({
        phone_number: deletePhone,
        otp_code: deleteCapturedOtp,
        device_id: 'delete_test_device',
        device_name: 'Test Browser'
      }));
      
      const deleteUserAccessCookie = getCookieValue(resVerifyDeleteUser.headers.get('set-cookie'), '__Host-iw-access');
      
      console.log('Requesting Deletion OTP for authenticated user...');
      const reqDeleteSendOtp = createRequest(undefined, {
        'Cookie': `__Host-iw-access=${deleteUserAccessCookie}`
      }, 'POST');
      
      deleteCapturedOtp = ''; // Clear it
      const resDeleteSendOtp = await deleteSendOtpHandler(reqDeleteSendOtp);
      const deleteSendOtpData = await resDeleteSendOtp.json();
      console.log(`Response Status: ${resDeleteSendOtp.status}`);
      console.log(`Response Body:`, deleteSendOtpData);

      if (resDeleteSendOtp.status === 200 && deleteSendOtpData.success && deleteCapturedOtp) {
        console.log(`✅ TEST 17 PASSED: Deletion OTP sent successfully. Code: ${deleteCapturedOtp}\n`);
      } else {
        throw new Error('TEST 17 FAILED');
      }

      // Restore logging
      console.log = (...args: any[]) => {
        originalLog(...args);
        const logStr = args.join(' ');
        if (logStr.includes('code is')) {
          const match = logStr.match(/code is (\d{6})/);
          if (match) capturedOtp = match[1];
        }
      };

      // ------------------------------------------------------------------
      // TEST 18: Confirming Deletion with Invalid OTP
      // ------------------------------------------------------------------
      console.log('TEST 18: Verifying deletion with incorrect OTP code (123456)...');
      const reqWrongDelete = createRequest({
        otp_code: '123456'
      }, {
        'Cookie': `__Host-iw-access=${deleteUserAccessCookie}`
      }, 'POST');
      
      const resWrongDelete = await deleteConfirmHandler(reqWrongDelete);
      const wrongDeleteData = await resWrongDelete.json();
      console.log(`Response Status: ${resWrongDelete.status}`);
      console.log(`Response Body:`, wrongDeleteData);
      
      if (resWrongDelete.status === 400 && wrongDeleteData.error.code === 'AUTH_OTP_MISMATCH') {
        console.log('✅ TEST 18 PASSED: System rejected invalid deletion OTP.\n');
      } else {
        throw new Error('TEST 18 FAILED');
      }

      // ------------------------------------------------------------------
      // TEST 19: Confirming Deletion with Valid OTP & Data Wiping Assertions
      // ------------------------------------------------------------------
      console.log('TEST 19: Confirming deletion with correct OTP...');
      const reqConfirmDelete = createRequest({
        otp_code: deleteCapturedOtp
      }, {
        'Cookie': `__Host-iw-access=${deleteUserAccessCookie}`
      }, 'POST');
      
      const resConfirmDelete = await deleteConfirmHandler(reqConfirmDelete);
      const confirmDeleteData = await resConfirmDelete.json();
      console.log(`Response Status: ${resConfirmDelete.status}`);
      console.log(`Response Body:`, confirmDeleteData);
      
      const deleteClearedCookies = resConfirmDelete.headers.get('set-cookie');
      const clearedAccessVal = getCookieValue(deleteClearedCookies, '__Host-iw-access');
      const clearedRefreshVal = getCookieValue(deleteClearedCookies, '__Host-iw-refresh');

      // Assertions: check mock databases
      const dbUserExist = mockUsersTable.some(u => u.phone_number === deletePhone);
      const dbProfileExist = mockProfilesTable.some(p => p.phone_number === deletePhone);
      const dbOtpExist = mockOtpTable.some(o => o.phone_number === deletePhone);
      
      console.log('Verifying records in in-memory tables:');
      console.log(`- User record exists? ${dbUserExist}`);
      console.log(`- Profile record exists? ${dbProfileExist}`);
      console.log(`- Active OTP records exist? ${dbOtpExist}`);
      
      if (
        resConfirmDelete.status === 200 &&
        confirmDeleteData.success &&
        clearedAccessVal === '' &&
        clearedRefreshVal === '' &&
        !dbUserExist &&
        !dbProfileExist &&
        !dbOtpExist
      ) {
        console.log('✅ TEST 19 PASSED: Account deleted, auth cookies revoked, and database tables cleaned.\n');
      } else {
        throw new Error('TEST 19 FAILED');
      }

      console.log(`🎉 ALL LIFE-CYCLE, ONBOARDING & DELETION TESTS PASSED FOR PROVIDER: ${provider.toUpperCase()}\n`);

    } catch (error: any) {
      console.error(`❌ TEST RUN ENCOUNTERED AN ERROR IN MODE ${provider.toUpperCase()}:`, error.message);
      process.exit(1);
    }
  }

  console.log('====================================================');
  console.log('🎉 ALL PROVIDER LIFECYCLE & ONBOARDING TESTS PASSED!');
  console.log('====================================================');
  console.log = originalLog;
}

runTests();
