import { z } from 'zod';

export const CatalogFilterSchema = z.object({
  category: z.string().optional(),
  max_duration: z.coerce.number().min(1).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  search: z.string().optional(),
  status: z.enum(['active', 'draft', 'archived']).optional().default('active'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

export const StartSessionSchema = z.object({
  intervention_id: z.string().min(1, 'intervention_id is required'),
});

export const ResumeSessionSchema = z.object({
  session_id: z.string().min(1, 'session_id is required'),
  last_position: z.union([z.number(), z.record(z.string(), z.unknown()), z.string()]).optional(),
  elapsed_seconds: z.number().min(0).optional(),
});

export const CompleteSessionSchema = z.object({
  session_id: z.string().min(1, 'session_id is required'),
  elapsed_seconds: z.number().min(0).optional(),
  responses: z.record(z.string(), z.unknown()).optional(),
});

export const FavoriteSchema = z.object({
  intervention_id: z.string().min(1, 'intervention_id is required'),
  action: z.enum(['favorite', 'unfavorite', 'toggle']).optional().default('toggle'),
});
