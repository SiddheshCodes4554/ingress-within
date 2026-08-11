import { NextRequest, NextResponse } from 'next/server';
import { ModuleContentService } from '../../../../../lib/modules/moduleContentService';

/**
 * GET /api/modules/[id]/content
 * Returns the full structured psychoeducation module content for module ID or slug.
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

    const content = ModuleContentService.getModuleContent(id);

    if (!content) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: `Content for module '${id}' not found.` } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      content
    });
  } catch (error: any) {
    console.error('[API /api/modules/[id]/content GET] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch module content.' } },
      { status: 500 }
    );
  }
}
