import { NextRequest, NextResponse } from 'next/server';
import { ModuleCatalogService } from '../../../../lib/modules/moduleCatalogService';

/**
 * GET /api/modules/[id]
 * Fetches a single psychoeducation module by ID (e.g. 'M1') or slug (e.g. 'self-worth-self-talk').
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Module ID or slug is required.' } },
        { status: 400 }
      );
    }

    const moduleData = await ModuleCatalogService.getModuleByIdOrSlug(id);

    if (!moduleData) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Module '${id}' not found in catalog.` } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      module: moduleData
    });
  } catch (error: any) {
    console.error('[API /api/modules/[id] GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch module detail.' } },
      { status: 500 }
    );
  }
}
