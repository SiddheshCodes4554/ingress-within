import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    // In production, we only allow simulation if NEXT_PUBLIC_ENABLE_TEST_PAGE === 'true'
    const isTestPageEnabled = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_TEST_PAGE === 'true';
    if (!isTestPageEnabled) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Test actions are disabled in this environment.' } },
        { status: 403 }
      );
    }

    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication is required.' } },
        { status: 401 }
      );
    }

    const userId = authUser.userId;
    const body = await request.json().catch(() => ({}));
    const { action, days, cycleId, cycleNumber } = body;

    // A. Fetch active or completed cycle
    let activeCycle: any = null;
    if (cycleId) {
      const { data } = await supabase.from('cycles').select('*').eq('id', cycleId).maybeSingle();
      activeCycle = data;
    } else {
      const { data } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      activeCycle = data;
    }

    if (action === 'progress' && activeCycle) {
      const shiftDays = Number(days || 1);
      const currentStart = new Date(activeCycle.start_date || activeCycle.started_at);
      const newStart = new Date(currentStart.getTime() - shiftDays * 24 * 60 * 60 * 1000);
      const newStartStr = newStart.toISOString().split('T')[0];

      const { data: updatedCycle, error } = await supabase
        .from('cycles')
        .update({
          start_date: newStartStr,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeCycle.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        message: `Progressed active cycle start date back by ${shiftDays} days.`,
        cycle: updatedCycle
      });
    }

    if (action === 'complete-cycle' && activeCycle) {
      // Shift start date back by 30 days to force completion on next status fetch
      const currentStart = new Date();
      const newStart = new Date(currentStart.getTime() - 31 * 24 * 60 * 60 * 1000);
      const newStartStr = newStart.toISOString().split('T')[0];

      const { data: updatedCycle, error } = await supabase
        .from('cycles')
        .update({
          start_date: newStartStr,
          status: 'COMPLETED',
          assessment_available: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', activeCycle.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        message: 'Simulated cycle completion successfully.',
        cycle: updatedCycle
      });
    }

    if (action === 'create-test') {
      const num = Number(cycleNumber || 1);
      const todayStr = new Date().toISOString().split('T')[0];

      // Deactivate any currently active cycles to make room
      await supabase
        .from('cycles')
        .update({ status: 'ARCHIVED' })
        .eq('user_id', userId)
        .eq('status', 'ACTIVE');

      const { data: newCycle, error } = await supabase
        .from('cycles')
        .insert({
          user_id: userId,
          cycle_number: num,
          status: 'ACTIVE',
          start_date: todayStr,
          total_days: 30,
          current_day: 1,
          days_completed: 0,
          entries_count: 0,
          assessment_completed: false,
          assessment_available: false
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        message: `Created test Cycle ${num} successfully.`,
        cycle: newCycle
      });
    }

    if (action === 'archive' && activeCycle) {
      const { data: archivedCycle, error } = await supabase
        .from('cycles')
        .update({
          status: 'ARCHIVED',
          updated_at: new Date().toISOString()
        })
        .eq('id', activeCycle.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        message: 'Archived test cycle successfully.',
        cycle: archivedCycle
      });
    }

    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid simulation action or missing active cycle.' } },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[API Cycles Simulate] Unexpected error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
