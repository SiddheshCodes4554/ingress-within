import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';

/**
 * GET /api/knowledge/audit: Developer-only endpoint returning engine metrics.
 * Hidden in production/non-development modes by returning a 404 response.
 */
export async function GET(request: NextRequest) {
  // Hide in production by returning a 404
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    // 1. Fetch counts
    const [
      { count: eventsCount },
      { count: profilesCount },
      { count: cardsCount }
    ] = await Promise.all([
      supabase.from('knowledge_events').select('*', { count: 'exact', head: true }),
      supabase.from('knowledge_profile').select('*', { count: 'exact', head: true }),
      supabase.from('knowledge_cards').select('*', { count: 'exact', head: true })
    ]);

    // 2. Fetch last processed event
    const { data: lastEvent } = await supabase
      .from('knowledge_events')
      .select('id, event_type, processed_at, created_at')
      .eq('processed', true)
      .order('processed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Fetch last backfill and processing status
    const { data: lastBackfillRecord } = await supabase
      .from('knowledge_backfill_status')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      number_of_events: eventsCount || 0,
      number_of_profiles: profilesCount || 0,
      number_of_cards: cardsCount || 0,
      last_processed_event: lastEvent ? {
        id: lastEvent.id,
        event_type: lastEvent.event_type,
        processed_at: lastEvent.processed_at,
        created_at: lastEvent.created_at
      } : null,
      last_backfill: lastBackfillRecord ? {
        user_id: lastBackfillRecord.user_id,
        started_at: lastBackfillRecord.started_at,
        completed_at: lastBackfillRecord.completed_at,
        status: lastBackfillRecord.status,
        current_step: lastBackfillRecord.current_step,
        processed_events: lastBackfillRecord.processed_events,
        remaining_events: lastBackfillRecord.remaining_events
      } : null,
      processing_status: lastBackfillRecord?.status || 'idle'
    });

  } catch (error: any) {
    console.error('[API Knowledge Audit GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
