import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { supabase } from '../../../../lib/db';

/**
 * GET /api/knowledge/evidence: Resolves raw DB UUIDs into text content/excerpts for user-facing transparency.
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entryIdsStr = searchParams.get('entries') || '';
    const reportIdsStr = searchParams.get('reports') || '';

    const entryIds = entryIdsStr.split(',').filter(Boolean);
    const reportIds = reportIdsStr.split(',').filter(Boolean);

    let journalExcerpts: any[] = [];
    let reportExcerpts: any[] = [];

    if (entryIds.length > 0) {
      const { data: entries } = await supabase
        .from('entries')
        .select('id, content, created_at, cycle_day')
        .in('id', entryIds)
        .eq('user_id', authUser.userId);
      
      if (entries) {
        journalExcerpts = entries.map(e => ({
          id: e.id,
          text: e.content,
          date: e.created_at,
          cycle_day: e.cycle_day
        }));
      }
    }

    if (reportIds.length > 0) {
      const { data: reports } = await supabase
        .from('weekly_summaries')
        .select('id, title, body, generated_at, week_number')
        .in('id', reportIds)
        .eq('user_id', authUser.userId);
      
      if (reports) {
        reportExcerpts = reports.map(r => ({
          id: r.id,
          title: r.title,
          text: r.body,
          date: r.generated_at,
          week_number: r.week_number
        }));
      }
    }

    return NextResponse.json({
      success: true,
      evidence: {
        journals: journalExcerpts,
        reports: reportExcerpts
      }
    });
  } catch (error: any) {
    console.error('[API Knowledge Evidence GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
