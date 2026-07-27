import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../../lib/auth-helper';
import { ExerciseRepository } from '../../../../lib/exercises/v4/repository/exerciseRepository';
import { ExerciseService } from '../../../../lib/exercises/v4/services/exerciseService';
import { supabase } from '../../../../lib/db';

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
    const { instance_id, question_id, response, current_image, current_step } = body;

    if (!instance_id || !question_id || response === undefined || response === null) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Must provide instance_id, question_id, and response.' } },
        { status: 400 }
      );
    }

    const instance = await ExerciseRepository.getInstance(instance_id);
    if (!instance) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Exercise instance not found.' } },
        { status: 404 }
      );
    }

    if (instance.user_id !== authUser.userId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied.' } },
        { status: 403 }
      );
    }

    const result = await ExerciseService.saveResponse({
      instance_id,
      user_id: authUser.userId,
      question_id,
      response
    });

    if (current_image !== undefined || current_step !== undefined) {
      const updateData: any = {};
      if (current_image !== undefined) updateData.current_image = current_image;
      if (current_step !== undefined) updateData.current_step = current_step;
      await supabase.from('exercise_instances').update(updateData).eq('id', instance_id);
    }

    return NextResponse.json({ success: true, response: result.response, instance: result.instance });
  } catch (error: any) {
    console.error('[POST /api/exercises/autosave] Error:', error);
    return NextResponse.json(
      { error: { code: 'AUTOSAVE_FAILED', message: error.message || 'Failed to save exercise response.' } },
      { status: 400 }
    );
  }
}
