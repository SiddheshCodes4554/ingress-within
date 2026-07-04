import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';
import { getAuthenticatedUser } from '../../../lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const userId = authUser.userId;

    // 1. Fetch all cycles metadata, ordered by cycle_number descending
    const { data: cycles, error: cyclesErr } = await supabase
      .from('cycles')
      .select('id, user_id, status, total_days, created_at, start_date, end_date, assessment_completed, assessment_available, entries_count, days_completed, current_day, cycle_number')
      .eq('user_id', userId)
      .order('cycle_number', { ascending: false });

    let cyclesToProcess: any[] = cycles || [];

    if (cyclesErr) {
      console.warn('Querying with cycle_number failed, falling back to number:', cyclesErr.message);
      const fallbackRes = await supabase
        .from('cycles')
        .select('id, user_id, number, status, total_days, created_at, start_date, end_date, assessment_completed, assessment_available, entries_count, days_completed, current_day')
        .eq('user_id', userId)
        .order('number', { ascending: false });
      
      if (fallbackRes.error) {
        throw new Error(`Failed to fetch cycles: ${fallbackRes.error.message}`);
      }
      
      cyclesToProcess = fallbackRes.data || [];
    }

    const cyclesMetadata = cyclesToProcess.map((cy: any) => {
      let activeDay = cy.current_day || 1;
      const isCycleActive = cy.status?.toUpperCase() === 'ACTIVE' || cy.status?.toUpperCase() === 'ARCHIVED';
      if (isCycleActive && cy.start_date && !cy.end_date) {
        const started = new Date(cy.start_date);
        const today = new Date();
        const startMidnight = new Date(started.getFullYear(), started.getMonth(), started.getDate());
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffTime = todayMidnight.getTime() - startMidnight.getTime();
        const calculatedDay = Math.floor(diffTime / (24 * 60 * 60 * 1000)) + 1;
        activeDay = Math.min(cy.total_days || 30, Math.max(cy.current_day || 1, calculatedDay));
      }
      const progressPercentage = Math.round((activeDay / (cy.total_days || 30)) * 100);
      
      return {
        id: cy.id,
        cycle_number: cy.cycle_number !== undefined ? cy.cycle_number : cy.number,
        status: cy.status,
        current_day: activeDay,
        total_days: cy.total_days || 30,
        progress_percentage: Math.min(100, progressPercentage),
        entries_count: cy.entries_count || 0,
        open_threads_count: 0, // Loaded on-demand
        weekly_summaries_count: 0, // Loaded on-demand
        vocabulary_count: 0, // Loaded on-demand
        start_date: cy.start_date || cy.started_at,
        end_date: cy.end_date || cy.ended_at,
        assessment_completed: cy.assessment_completed,
        assessment_available: cy.assessment_available,
        entries: null // Loaded on-demand
      };
    });

    return NextResponse.json({
      success: true,
      cycles: cyclesMetadata
    });

  } catch (error: any) {
    console.error('[API Cycles List] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
