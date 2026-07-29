import { NextRequest, NextResponse } from 'next/server';
import { interventionEngine } from '../../../../lib/interventions/engine/intervention-engine';

/**
 * GET /api/interventions/categories
 * Returns categories breakdown with technique counts and crisis resources.
 */
export async function GET(request: NextRequest) {
  try {
    const data = await interventionEngine.getCategories();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('GET /api/interventions/categories error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
