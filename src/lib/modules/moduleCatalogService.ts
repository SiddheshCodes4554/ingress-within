import { supabase } from '../db';
import { ModuleWithTaxonomy } from '../../types/moduleCatalog';

/**
 * Authoritative fallback catalog data for Modules M1 - M3.
 * Durations are stored strictly as metadata.
 */
export const STATIC_MODULE_CATALOG: ModuleWithTaxonomy[] = [
  {
    id: 'M1',
    slug: 'self-worth-self-talk',
    name: 'Self-Worth & Self-Talk',
    description: 'A structured psychoeducation program addressing core self-criticism, guilt, and confidence patterns through evidence-based cognitive and somatic techniques.',
    price: 349.00,
    currency: 'INR',
    status: 'active',
    version: '1.0',
    duration_weeks: 7,
    taxonomy_concerns: ['M1-C01', 'M1-C02', 'M1-C03'],
    created_at: '2026-08-11T00:00:00.000Z',
    updated_at: '2026-08-11T00:00:00.000Z'
  },
  {
    id: 'M2',
    slug: 'perfectionism-avoidance',
    name: 'Perfectionism & Avoidance',
    description: 'A clinical framework targeting rigid high standards, task avoidance, and performance anxiety using ACT and exposure-based micro-practices.',
    price: 349.00,
    currency: 'INR',
    status: 'active',
    version: '1.0',
    duration_weeks: 5,
    taxonomy_concerns: ['M2-C01', 'M2-C02'],
    created_at: '2026-08-11T00:00:00.000Z',
    updated_at: '2026-08-11T00:00:00.000Z'
  },
  {
    id: 'M3',
    slug: 'anxiety-worry',
    name: 'Anxiety & Worry',
    description: 'A comprehensive psychoeducation system addressing chronic rumination, panic, intrusive thoughts, and physiological hyperarousal.',
    price: 499.00,
    currency: 'INR',
    status: 'active',
    version: '1.0',
    duration_weeks: 9,
    taxonomy_concerns: ['M3-C01', 'M3-C02', 'M3-C03', 'M3-C04'],
    created_at: '2026-08-11T00:00:00.000Z',
    updated_at: '2026-08-11T00:00:00.000Z'
  }
];

export class ModuleCatalogService {
  /**
   * Fetches all active psychoeducation modules with taxonomy mappings.
   */
  public static async getAllModules(): Promise<ModuleWithTaxonomy[]> {
    try {
      const { data: dbModules, error: modErr } = await supabase
        .from('modules')
        .select('*')
        .eq('status', 'active');

      if (modErr || !dbModules || dbModules.length === 0) {
        return STATIC_MODULE_CATALOG;
      }

      const { data: dbTaxonomy } = await supabase
        .from('module_taxonomy_mapping')
        .select('*');

      const taxonomyMap = new Map<string, string[]>();
      (dbTaxonomy || []).forEach((t: any) => {
        const list = taxonomyMap.get(t.module_id) || [];
        list.push(t.taxonomy_concern_id);
        taxonomyMap.set(t.module_id, list);
      });

      return dbModules.map((m: any) => ({
        id: m.id,
        slug: m.slug,
        name: m.name,
        description: m.description || '',
        price: Number(m.price || 0),
        currency: m.currency || 'INR',
        status: m.status || 'active',
        version: m.version || '1.0',
        duration_weeks: Number(m.duration_weeks || 1),
        taxonomy_concerns: taxonomyMap.get(m.id) || [],
        created_at: m.created_at,
        updated_at: m.updated_at
      }));
    } catch (err) {
      console.warn('[ModuleCatalogService] DB query error, using static catalog:', err);
      return STATIC_MODULE_CATALOG;
    }
  }

  /**
   * Fetches a specific module by ID (e.g. 'M1') or slug (e.g. 'self-worth-self-talk').
   */
  public static async getModuleByIdOrSlug(idOrSlug: string): Promise<ModuleWithTaxonomy | null> {
    if (!idOrSlug) return null;
    const normalized = idOrSlug.toLowerCase().trim();

    const all = await this.getAllModules();
    const match = all.find(
      m => m.id.toLowerCase() === normalized || m.slug.toLowerCase() === normalized
    );

    return match || null;
  }

  /**
   * Fetches modules mapped to a specific stable taxonomy concern ID (e.g. 'M1-C01').
   */
  public static async getModulesByTaxonomyConcern(taxonomyConcernId: string): Promise<ModuleWithTaxonomy[]> {
    if (!taxonomyConcernId) return [];
    const normalized = taxonomyConcernId.trim();

    const all = await this.getAllModules();
    return all.filter(m => m.taxonomy_concerns.includes(normalized));
  }
}
