import { supabase } from '../../db';
import { InterventionCategory } from '../types/intervention';
import { SEED_CATEGORIES } from '../catalog/seeder';

export class CategoryRepository {
  /**
   * Fetches all categories ordered by display_order.
   */
  async findAll(): Promise<InterventionCategory[]> {
    try {
      const { data, error } = await supabase
        .from('intervention_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as InterventionCategory[];
      }
    } catch (e) {
      console.warn('[CategoryRepository] DB lookup fallback to SEED_CATEGORIES:', e);
    }

    return SEED_CATEGORIES;
  }

  /**
   * Finds category by ID or slug.
   */
  async findByIdOrSlug(idOrSlug: string): Promise<InterventionCategory | null> {
    try {
      const { data, error } = await supabase
        .from('intervention_categories')
        .select('*')
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .maybeSingle();

      if (!error && data) {
        return data as InterventionCategory;
      }
    } catch (e) {
      console.warn('[CategoryRepository] Single category lookup fallback:', e);
    }

    return SEED_CATEGORIES.find((c) => c.id === idOrSlug || c.slug === idOrSlug) || null;
  }
}
