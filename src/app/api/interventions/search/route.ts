import { NextRequest, NextResponse } from 'next/server';
import { interventionEngine } from '../../../../lib/interventions/engine/intervention-engine';

/**
 * GET /api/interventions/search?q=query
 * Dedicated search endpoint for interventions catalog.
 */
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q') || request.nextUrl.searchParams.get('query') || '';
    const category = request.nextUrl.searchParams.get('category') || undefined;
    const maxDuration = request.nextUrl.searchParams.get('max_duration');

    const searchResults = await interventionEngine.search(query, {
      category,
      max_duration: maxDuration ? parseInt(maxDuration, 10) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: searchResults.data,
      pagination: searchResults.pagination,
    });
  } catch (error) {
    console.error('GET /api/interventions/search error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
