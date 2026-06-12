import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    // 2. Parse payload
    const body = await request.json().catch(() => ({}));
    const { terms_version, privacy_version } = body;

    const termsVer = terms_version || 'v1.0.0';
    const privacyVer = privacy_version || 'v1.0.0';

    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // 3. Log consent to audit trail
    await supabase.from('consents').insert({
      user_id: user.userId,
      consent_type: 'terms_and_privacy',
      version: `${termsVer}:${privacyVer}`,
      ip_address: ipAddress
    });

    // 4. Update onboarding profile progress
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ consent_completed: true })
      .eq('id', user.userId);

    if (updateError) {
      console.error('Failed to update consent progress:', updateError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to update onboarding progress.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Consent record updated successfully.'
    });

  } catch (error) {
    console.error('Onboarding Consent Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
