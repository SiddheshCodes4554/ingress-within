import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const entryId = params.id;
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    if (!entryId) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Missing entry ID.' } },
        { status: 400 }
      );
    }

    const { data: entry, error } = await supabase
      .from('entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (error) {
      console.error(`[api/entries/[id]] Database error fetching entry ${entryId}:`, error);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve entry.' } },
        { status: 500 }
      );
    }

    if (!entry) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Entry not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      entry
    });

  } catch (error) {
    console.error('Entry GET Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
