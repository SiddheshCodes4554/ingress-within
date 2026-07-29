import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '../../../lib/auth-helper';
import { interventionEngine } from '../../../lib/interventions/engine/intervention-engine';
import { CatalogFilterSchema } from '../../../lib/interventions/validators/intervention.schema';

/**
 * GET /api/interventions
 * Catalog & Search with pagination & filtering.
 * Authenticated user or public catalog preview.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parseResult = CatalogFilterSchema.safeParse(searchParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const filters = parseResult.data;
    const catalog = await interventionEngine.getCatalog(filters);

    return NextResponse.json({
      success: true,
      data: catalog.data,
      pagination: catalog.pagination,
    });
  } catch (error) {
    console.error('GET /api/interventions error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
