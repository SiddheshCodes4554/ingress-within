import { z } from 'zod';

// Schema for a single text part's scored dimensions
export const scoreDimensionSchema = z.object({
  ei: z.number().min(1.0).max(10.0),
  pr: z.number().min(1.0).max(10.0),
  sa: z.number().min(1.0).max(10.0),
});

// Zod validation schema for the raw LLM scoring response
export const llmScoringResponseSchema = z.object({
  reflection: scoreDimensionSchema.nullable(),
  newEntry: scoreDimensionSchema.nullable(),
  confidenceFlag: z.boolean(),
  confidenceReason: z.string().min(1, 'Confidence reason is required'),
  riskLanguageDetected: z.boolean(),
  riskLanguageQuote: z.string().nullable(),
  arcScoringApplied: z.boolean().default(false),
}).refine(data => {
  // Reject if both are null (an entry must have at least reflection or newEntry scored)
  return data.reflection !== null || data.newEntry !== null;
}, {
  message: 'At least one of "reflection" or "newEntry" must be scored and not null.',
  path: ['reflection', 'newEntry']
});

// Type definitions inferred from schemas
export type ScoreDimension = z.infer<typeof scoreDimensionSchema>;
export type LlmScoringResponse = z.infer<typeof llmScoringResponseSchema>;

/**
 * Validates the raw response from LLM against the Zod schema.
 * Throws a detailed ZodError if validation fails.
 */
export function validateLlmScoringResponse(data: any): LlmScoringResponse {
  return llmScoringResponseSchema.parse(data);
}
