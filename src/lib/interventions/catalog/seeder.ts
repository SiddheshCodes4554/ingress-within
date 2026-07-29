import { supabase } from '../../db';
import { Intervention, InterventionCategory } from '../types/intervention';
import { SEED_INTERVENTIONS } from './seed-data';

export const SEED_CATEGORIES: InterventionCategory[] = [
  {
    id: 'anxiety_worry',
    slug: 'anxiety-worry',
    name: 'Anxiety & Worry',
    description: 'Breathing, grounding, and thought-record techniques for worry and racing thoughts.',
    icon: 'wind',
    display_order: 1,
    is_featured: true,
    is_crisis: false,
  },
  {
    id: 'low_mood_depression',
    slug: 'low-mood-depression',
    name: 'Low Mood & Depression',
    description: 'Behavioral activation and small-step tools for low motivation and low mood.',
    icon: 'sun',
    display_order: 2,
    is_featured: true,
    is_crisis: false,
  },
  {
    id: 'stress_overwhelm',
    slug: 'stress-overwhelm',
    name: 'Stress & Overwhelm',
    description: 'Quick resets and planning tools for when too much is happening at once.',
    icon: 'zap',
    display_order: 3,
    is_featured: true,
    is_crisis: false,
  },
  {
    id: 'sleep_issues',
    slug: 'sleep-issues',
    name: 'Sleep',
    description: 'Wind-down routines and techniques for a racing mind at bedtime.',
    icon: 'moon',
    display_order: 4,
    is_featured: true,
    is_crisis: false,
  },
  {
    id: 'anger_irritability',
    slug: 'anger-irritability',
    name: 'Anger & Irritability',
    description: 'Pause techniques and pattern-tracking for anger and irritability.',
    icon: 'shield-alert',
    display_order: 5,
    is_featured: false,
    is_crisis: false,
  },
  {
    id: 'grief_loss',
    slug: 'grief-loss',
    name: 'Grief & Loss',
    description: 'Expressive and reflective practices to process loss.',
    icon: 'heart',
    display_order: 6,
    is_featured: false,
    is_crisis: false,
  },
  {
    id: 'family_relationship',
    slug: 'family-relationship',
    name: 'Family & Relationships',
    description: 'Communication tools for difficult family and relationship conversations.',
    icon: 'users',
    display_order: 7,
    is_featured: false,
    is_crisis: false,
  },
  {
    id: 'loneliness_isolation',
    slug: 'loneliness-isolation',
    name: 'Loneliness & Isolation',
    description: 'Small, low-pressure steps to rebuild connection.',
    icon: 'user',
    display_order: 8,
    is_featured: false,
    is_crisis: false,
  },
  {
    id: 'panic_attacks',
    slug: 'panic-attacks',
    name: 'Panic Attacks',
    description: 'In-the-moment grounding for panic, and reflection afterward.',
    icon: 'activity',
    display_order: 9,
    is_featured: true,
    is_crisis: false,
  },
  {
    id: 'self_esteem',
    slug: 'self-esteem',
    name: 'Self-Esteem',
    description: 'Evidence-based exercises to counter harsh self-criticism.',
    icon: 'sparkles',
    display_order: 10,
    is_featured: false,
    is_crisis: false,
  },
  {
    id: 'academic_work_pressure',
    slug: 'academic-work-pressure',
    name: 'Academic & Work Pressure',
    description: 'Tools for exam, career, and performance pressure.',
    icon: 'book-open',
    display_order: 11,
    is_featured: true,
    is_crisis: false,
  },
  {
    id: 'crisis_safety',
    slug: 'crisis-safety',
    name: 'Crisis & Safety Planning',
    description: 'Safety planning and reflection for moments of crisis.',
    icon: 'life-buoy',
    display_order: 12,
    is_featured: true,
    is_crisis: true,
  },
];

export class InterventionSeeder {
  /**
   * Idempotently seeds categories and interventions into the database.
   * Safe to rerun multiple times.
   */
  public static async seedAll(): Promise<{ categories_seeded: number; interventions_seeded: number }> {
    console.log('[InterventionSeeder] Running idempotent seed...');

    // 1. Seed Categories
    const { error: catErr } = await supabase
      .from('intervention_categories')
      .upsert(SEED_CATEGORIES, { onConflict: 'id' });

    if (catErr) {
      console.warn('[InterventionSeeder] Categories upsert error:', catErr.message);
    }

    // 2. Prepare Interventions Payload for Phase 2 Schema
    const formattedInterventions = SEED_INTERVENTIONS.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      short_description: item.short_description,
      long_description: item.long_description || item.short_description,
      category: item.category,
      subcategory: null,
      difficulty: item.difficulty || 'easy',
      estimated_duration: item.estimated_duration || 5,
      cover_image: item.cover_image || null,
      icon: item.icon || item.category,
      steps: item.steps || [],
      questions: [
        {
          id: `q_${item.id}_1`,
          prompt: `How did you feel before and after completing ${item.title}?`,
          type: 'text',
        },
      ],
      completion_type: 'guided_steps',
      tags: item.tags || [],
      contraindications: [],
      benefits: [item.short_description],
      status: 'active',
      content_version: 1,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // 3. Seed Interventions
    const { error: intErr } = await supabase
      .from('interventions')
      .upsert(formattedInterventions, { onConflict: 'id' });

    if (intErr) {
      console.warn('[InterventionSeeder] Interventions upsert error:', intErr.message);
    }

    console.log('[InterventionSeeder] Idempotent seed complete!');

    return {
      categories_seeded: SEED_CATEGORIES.length,
      interventions_seeded: formattedInterventions.length,
    };
  }
}
