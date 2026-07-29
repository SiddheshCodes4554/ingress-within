import { z } from 'zod';

export const StepDefinitionSchema = z.object({
  step_id: z.string().min(1),
  step_number: z.number().int().positive(),
  step_type: z.enum([
    'instruction',
    'text',
    'breathing',
    'timer',
    'checklist',
    'reflection',
    'image',
    'video',
    'audio',
    'completion',
  ]).or(z.string()),
  title: z.string().min(1),
  content: z.string(),
  optional_question: z.object({
    id: z.string(),
    prompt: z.string(),
    type: z.enum(['text', 'rating', 'choice']).optional(),
    options: z.array(z.string()).optional(),
  }).optional(),
  optional_media: z.object({
    type: z.enum(['image', 'audio', 'video', 'animation']),
    url: z.string(),
    caption: z.string().optional(),
  }).optional(),
  items: z.array(z.string()).optional(), // for checklist steps
  estimated_duration: z.number().nonnegative().default(60), // in seconds
  allow_previous: z.boolean().default(true),
  auto_advance: z.boolean().default(false),
});

export const InterventionDefinitionSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).or(z.string()).default('easy'),
  duration: z.number().positive(), // in minutes
  coverImage: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  steps: z.array(StepDefinitionSchema).min(1),
  content_version: z.number().int().positive().default(1),
});

export type StepDefinition = z.infer<typeof StepDefinitionSchema>;
export type InterventionDefinition = z.infer<typeof InterventionDefinitionSchema>;

export class ContentValidator {
  /**
   * Validates an intervention JSON definition against the schema.
   * Throws ZodError if validation fails, or returns typed definition.
   */
  static validate(definition: unknown): InterventionDefinition {
    return InterventionDefinitionSchema.parse(definition);
  }

  /**
   * Safe validation check returning boolean & error messages without throwing.
   */
  static safeValidate(definition: unknown): { success: boolean; data?: InterventionDefinition; errors?: string[] } {
    const result = InterventionDefinitionSchema.safeParse(definition);
    if (result.success) {
      return { success: true, data: result.data };
    }
    const issues = result.error.issues || (result.error as any).errors || [];
    const errors = issues.map((e: any) => `${e.path?.join('.') || 'root'}: ${e.message}`);
    return { success: false, errors };
  }
}
