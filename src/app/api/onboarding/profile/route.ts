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
    const { full_name } = body;

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'What should we call you? Please enter a name (at least 2 letters).'
          }
        },
        { status: 400 }
      );
    }

    const cleanName = full_name.trim();

    // 3. Update public.users record (for general name lookup)
    await supabase
      .from('users')
      .update({ name: cleanName })
      .eq('id', user.userId);

    // 4. Update profile, auto-completing notifications step at the same time
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: cleanName,
        profile_completed: true,
        notifications_completed: true // Auto-complete notifications
      })
      .eq('id', user.userId);

    if (updateError) {
      console.error('Failed to update profile progress:', updateError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to update onboarding progress.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile and notification preferences initialized successfully.'
    });

  } catch (error) {
    console.error('Onboarding Profile Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
