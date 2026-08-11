/**
 * Type definitions for the Psychoeducation Module Catalog.
 */

export type ModuleStatus = 'active' | 'draft' | 'archived';

export interface ModuleCatalogItem {
  id: string; // e.g. 'M1', 'M2', 'M3'
  slug: string; // e.g. 'self-worth-self-talk'
  name: string; // e.g. 'Self-Worth & Self-Talk'
  description: string;
  price: number; // e.g. 349.00
  currency: string; // e.g. 'INR'
  status: ModuleStatus;
  version: string; // e.g. '1.0'
  duration_weeks: number; // e.g. 7, 5, 9 (metadata driven)
  created_at?: string;
  updated_at?: string;
}

export interface ModuleTaxonomyMapping {
  id?: string;
  module_id: string; // e.g. 'M1'
  taxonomy_concern_id: string; // e.g. 'M1-C01', 'M1-C02', 'M1-C03'
  created_at?: string;
}

export interface ModuleWithTaxonomy extends ModuleCatalogItem {
  taxonomy_concerns: string[]; // Stable taxonomy concern IDs e.g. ['M1-C01', 'M1-C02', 'M1-C03']
}
