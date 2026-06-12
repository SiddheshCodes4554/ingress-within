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

    // 2. Update profiles orientation completion status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ orientation_completed: true })
      .eq('id', user.userId);

    if (updateError) {
      console.error('Failed to update orientation progress:', updateError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to update onboarding progress.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Orientation onboarding progress updated.'
    });

  } catch (error) {
    console.error('Onboarding Welcome Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
