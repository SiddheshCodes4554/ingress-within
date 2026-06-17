import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';
import { getAuthenticatedUser } from '../../../lib/auth-helper';
import { triggerAIProcessing, checkWeeklyAndMonthlySummary } from '../../../lib/queue/triggers';

/**
 * GET /api/entries: Fetches all journal entries for the user from Supabase.
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

    let { data: entries, error } = await supabase
      .from('entries')
      .select('*, daily_sessions(day_number)')
      .eq('user_id', authUser.userId)
      .order('created_at', { ascending: false });

    // Fallback if the database schema is not fully migrated (missing session_id column or relational ambiguity)
    if (error && (error.code === 'PGRST201' || error.code === 'PGRST200' || error.message.includes('relationship') || error.message.includes('column'))) {
      console.warn('[api/entries] Join query failed, falling back to simple select (schema may need migration):', error.message);
      const { data: simpleEntries, error: simpleError } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', authUser.userId)
        .order('created_at', { ascending: false });
        
      if (simpleError) {
        console.error('Failed to fetch journal entries on fallback:', simpleError);
        return NextResponse.json(
          { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve journal entries.' } },
          { status: 500 }
        );
      }
      entries = simpleEntries;
    } else if (error) {
      console.error('Failed to fetch journal entries:', error);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to retrieve journal entries.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entries: entries || []
    });

  } catch (error) {
    console.error('Entries GET Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/entries: Saves a new free-form journal entry in Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Journal entry content cannot be empty.' } },
        { status: 400 }
      );
    }

    // Daily limit validation: Check if they have already written today
    const clientTodayStart = request.headers.get('x-client-today-start');
    const fallbackStart = new Date();
    fallbackStart.setUTCHours(0, 0, 0, 0);
    const startRange = clientTodayStart || fallbackStart.toISOString();

    const { data: existingEntries, error: checkError } = await supabase
      .from('entries')
      .select('id')
      .eq('user_id', authUser.userId)
      .gte('created_at', startRange)
      .limit(1);

    if (checkError) {
      console.error('Failed to check existing entries for daily limit:', checkError);
    } else if (existingEntries && existingEntries.length > 0) {
      return NextResponse.json(
        { error: { code: 'LIMIT_EXCEEDED', message: 'You have already completed your writing for today. The limit resets at midnight.' } },
        { status: 400 }
      );
    }

    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    // Fetch the active cycle for the user to populate cycle_id and cycle_day
    const { data: activeCycle } = await supabase
      .from('cycles')
      .select('id, started_at')
      .eq('user_id', authUser.userId)
      .eq('status', 'active')
      .maybeSingle();

    const cycleId = activeCycle?.id || null;
    let cycleDay = 1;
    if (activeCycle) {
      const started = new Date(activeCycle.started_at);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - started.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      cycleDay = Math.min(30, Math.max(1, diffDays));
    }

    const insertPayload: any = {
      user_id: authUser.userId,
      content: content.trim(),
      new_entry_text_encrypted: content.trim(), // for future AI workflow compatibility
      entry_type: 'new_only',
      word_count: wordCount,
      session_id: null,
      cycle_id: cycleId,
      cycle_day: cycleDay,
      written_at: new Date().toISOString()
    };

    let { data: newEntry, error } = await supabase
      .from('entries')
      .insert(insertPayload)
      .select()
      .single();

    // Fallback if the database schema is not fully migrated (missing new columns)
    if (error && (error.message.includes('column') || error.code === 'PGRST200' || error.code === '42703')) {
      console.warn('[api/entries] Insert failed with cycle/encryption columns, retrying with basic columns...');
      const fallbackPayload = {
        user_id: authUser.userId,
        content: content.trim(),
        word_count: wordCount,
        session_id: null
      };
      const { data: fallbackEntry, error: fallbackError } = await supabase
        .from('entries')
        .insert(fallbackPayload)
        .select()
        .single();
        
      if (fallbackError) {
        console.error('Failed to insert journal entry on fallback:', fallbackError);
        return NextResponse.json(
          { error: { code: 'DATABASE_ERROR', message: 'Failed to save journal entry.' } },
          { status: 500 }
        );
      }
      newEntry = fallbackEntry;
    } else if (error) {
      console.error('Failed to insert journal entry:', error);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to save journal entry.' } },
        { status: 500 }
      );
    }

    if (newEntry) {
      // Trigger background AI tasks and check weekly/monthly milestones
      triggerAIProcessing(newEntry.id, authUser.userId);
      checkWeeklyAndMonthlySummary(authUser.userId, newEntry.cycle_id, newEntry.cycle_day);
    }

    return NextResponse.json({
      success: true,
      entry: newEntry
    });

  } catch (error) {
    console.error('Entries POST Route Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
