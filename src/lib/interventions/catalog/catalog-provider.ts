import { SEED_INTERVENTIONS } from './seed-data';
import { Intervention } from '../types/intervention';
import { supabase } from '../../db';
import { ContentValidator } from '../validators/content.validator';
import { ContentMigrator } from '../engine/content/migrator';

export class CatalogProvider {
  private static cachedCatalog: Intervention[] | null = null;

  /**
   * Retrieves full catalog with fallback to memory seed data if DB is unavailable or empty.
   * All loaded definitions are validated and migrated deterministically.
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
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        const validated = data.map((item) => {
          const migrated = ContentMigrator.migrate(item);
          ContentValidator.validate(migrated);
          return item as Intervention;
        });

        this.cachedCatalog = validated;
        return this.cachedCatalog;
      }
    } catch (err) {
      console.warn('[CatalogProvider] Supabase query fallback to seed data:', err);
    }

    // Fallback to in-memory seed catalog validated through ContentValidator
    const validatedSeed = SEED_INTERVENTIONS.map((item) => {
      const migrated = ContentMigrator.migrate(item);
      ContentValidator.validate(migrated);
      return item;
    });

    this.cachedCatalog = validatedSeed;
    return validatedSeed;
  }
}
