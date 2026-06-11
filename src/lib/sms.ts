export interface SmsResult {
  success: boolean;
  message: string;
  requestId?: string;
}

/**
 * Sends a transactional 6-digit OTP SMS using Fast2SMS bulkV2 endpoint.
 * Falls back to mock simulation if FAST2SMS_API_KEY is not defined or is set to "mock_developer_key".
 */
export async function sendOtpSms(phoneNumber: string, otpCode: string): Promise<SmsResult> {
  const apiKey = process.env.FAST2SMS_API_KEY || '';
  const route = process.env.FAST2SMS_ROUTE || 'otp';
  const senderId = process.env.FAST2SMS_SENDER_ID || '';
  const dltTemplateId = process.env.FAST2SMS_DLT_TEMPLATE_ID || '142857';

  // Fast2SMS requires 10-digit Indian numbers without the country code prefix (+91)
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const tenDigitPhone = cleanNumber.length > 10 ? cleanNumber.slice(-10) : cleanNumber;

  if (apiKey === 'mock_developer_key' || !apiKey) {
    console.log(`\n--- [SMS GATEWAY SIMULATOR] ---`);
    console.log(`Recipient: +91 ${tenDigitPhone}`);
    console.log(`Route: ${route}`);
    if (route === 'dlt') {
      console.log(`DLT Sender ID: ${senderId}`);
      console.log(`DLT Template ID: ${dltTemplateId}`);
    }
    console.log(`Message Body: Your Ingress Within verification code is ${otpCode}. Valid for 5 minutes.`);
    console.log(`---------------------------------\n`);
    
    return {
      success: true,
      message: `Mock OTP code ${otpCode} sent to +91 ${tenDigitPhone} via simulated gateway.`
    };
  }

  try {
    const payload: any = {
      route: route,
      numbers: tenDigitPhone
    };

    if (route === 'dlt') {
      payload.sender_id = senderId || 'INGWRT';
      payload.message = dltTemplateId;
      payload.variables_values = otpCode;
    } else if (route === 'q') {
      payload.message = `Your Ingress Within verification code is ${otpCode}. Valid for 5 minutes.`;
    } else {
      payload.variables_values = otpCode;
    }

    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json() as any;

    if (response.ok && data.return === true) {
      return {
        success: true,
        message: data.message?.[0] || 'SMS dispatched successfully',
        requestId: data.request_id
      };
    } else {
      return {
        success: false,
        message: data.message || 'Gateway returned failure response status'
      };
    }
  } catch (error: any) {
    console.error('Fast2SMS dispatch error:', error);
    return {
      success: false,
      message: error.message || 'Connection failure to Fast2SMS REST API'
    };
  }
}
