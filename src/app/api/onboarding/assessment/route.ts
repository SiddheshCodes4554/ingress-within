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

    // 2. Complete both assessment and total onboarding milestones
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        assessment_completed: true,
        onboarding_completed: true
      })
      .eq('id', user.userId);

    if (updateError) {
      console.error('Failed to finalize onboarding progress:', updateError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to update onboarding progress.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding flow finalized successfully.'
    });

  } catch (error) {
    console.error('Onboarding Assessment Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
