import { SEED_INTERVENTIONS } from './seed-data';
import { Intervention } from '../types/intervention';
import { supabase } from '../../db';

export class CatalogProvider {
  private static cachedCatalog: Intervention[] | null = null;

  /**
   * Retrieves full catalog with fallback to memory seed data if DB is unavailable or empty.
   */
  public static async getCatalog(): Promise<Intervention[]> {
    if (this.cachedCatalog && process.env.NODE_ENV !== 'development') {
      return this.cachedCatalog;
    }

    try {
      const { data, error } = await supabase
        .from('interventions')
        .select('*')
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        this.cachedCatalog = data as Intervention[];
        return this.cachedCatalog;
      }
    } catch (err) {
      console.warn('[CatalogProvider] Supabase query fallback to seed data:', err);
    }

    // Fallback to in-memory seed catalog
    this.cachedCatalog = SEED_INTERVENTIONS;
    return SEED_INTERVENTIONS;
  }

  /**
   * Ensures the DB has the initial seed interventions.
   */
  public static async seedDatabaseIfEmpty(): Promise<boolean> {
    try {
      const { count, error: countErr } = await supabase
        .from('interventions')
        .select('*', { count: 'exact', head: true });

      if (countErr) {
        console.warn('[CatalogProvider] DB seed check failed:', countErr.message);
        return false;
      }

      if (count === 0) {
        console.log('[CatalogProvider] Seeding 35 interventions into database...');
        const { error: insertErr } = await supabase
          .from('interventions')
          .upsert(SEED_INTERVENTIONS, { onConflict: 'id' });

        if (insertErr) {
          console.error('[CatalogProvider] Seeding error:', insertErr.message);
          return false;
        }
        console.log('[CatalogProvider] Database successfully seeded!');
        return true;
      }
    } catch (e) {
      console.error('[CatalogProvider] Unexpected seeding error:', e);
    }
    return false;
  }
}
