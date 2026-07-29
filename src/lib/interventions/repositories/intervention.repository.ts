import { supabase } from '../../db';
import { Intervention } from '../types/intervention';
import { CatalogFilterParams, PaginatedResult } from '../types/dto';
import { CatalogProvider } from '../catalog/catalog-provider';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../constants/defaults';

export class InterventionRepository {
  /**
   * Fetches paginated catalog of active, non-deleted interventions with optional filters.
   */
  async findCatalog(params: CatalogFilterParams): Promise<PaginatedResult<Intervention>> {
    const page = params.page || DEFAULT_PAGE;
    const limit = params.limit || DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    try {
      let query = supabase
        .from('interventions')
        .select('*', { count: 'exact' })
        .eq('status', params.status || 'active')
        .is('deleted_at', null);

      if (params.category) {
        query = query.eq('category', params.category);
      }

      if (params.max_duration) {
        query = query.lte('duration_minutes', params.max_duration);
      }

      if (params.difficulty) {
        query = query.eq('difficulty', params.difficulty);
      }

      if (params.search) {
        const searchTerm = `%${params.search.trim()}%`;
        query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`);
      }

      query = query.range(offset, offset + limit - 1).order('id', { ascending: true });

      const { data, count, error } = await query;

      if (!error && data) {
        const total = count || data.length;
        return {
          data: data as Intervention[],
          pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit) || 1,
            has_more: offset + data.length < total,
          },
        };
      }
    } catch (e) {
      console.warn('[InterventionRepository] DB lookup error, using in-memory catalog fallback:', e);
    }

    // In-memory fallback if DB table does not exist or fails
    let all = await CatalogProvider.getCatalog();
    all = all.filter((i) => !i.deleted_at && (params.status ? i.status === params.status : i.status === 'active'));

    if (params.category) {
      all = all.filter((i) => i.category === params.category);
    }
    if (params.max_duration) {
      all = all.filter((i) => i.duration_minutes <= params.max_duration!);
    }
    if (params.difficulty) {
      all = all.filter((i) => i.difficulty === params.difficulty);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      all = all.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    const total = all.length;
    const paginated = all.slice(offset, offset + limit);

    return {
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
        has_more: offset + paginated.length < total,
      },
    };
  }

  /**
   * Finds an intervention by ID or Slug.
   */
  async findByIdOrSlug(idOrSlug: string): Promise<Intervention | null> {
    try {
      const { data, error } = await supabase
        .from('interventions')
        .select('*')
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .is('deleted_at', null)
        .maybeSingle();

      if (!error && data) {
        return data as Intervention;
      }
    } catch (e) {
      console.warn('[InterventionRepository] Single fetch DB fallback:', e);
    }

    const all = await CatalogProvider.getCatalog();
    return all.find((i) => (i.id === idOrSlug || i.slug === idOrSlug) && !i.deleted_at) || null;
  }
}
