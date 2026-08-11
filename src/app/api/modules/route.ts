import { NextRequest, NextResponse } from 'next/server';
import { ModuleCatalogService } from '../../../lib/modules/moduleCatalogService';

/**
 * GET /api/modules
 * Fetches all active psychoeducation catalog modules with stable taxonomy IDs and metadata.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const concernId = searchParams.get('taxonomy_concern_id');

    if (concernId) {
      const filtered = await ModuleCatalogService.getModulesByTaxonomyConcern(concernId);
      return NextResponse.json({
        success: true,
        count: filtered.length,
        modules: filtered
      });
    }

    const modules = await ModuleCatalogService.getAllModules();

    return NextResponse.json({
      success: true,
      count: modules.length,
      modules
    });
  } catch (error: any) {
    console.error('[API /api/modules GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch module catalog.' } },
      { status: 500 }
    );
  }
}
