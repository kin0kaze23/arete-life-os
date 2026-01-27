import { z } from 'zod';

export const RecommendationSchema = z.object({
  category: z.string(),
  title: z.string().min(3),
  description: z.string().min(5),
  impactScore: z.number().min(1).max(10),
  rationale: z.string().min(5),
  steps: z.array(z.string()).default([]),
  estimatedTime: z.string().optional().default(''),
  inputs: z.array(z.string()).default([]),
  definitionOfDone: z.string().optional().default(''),
  risks: z.array(z.string()).default([]),
});

export const TaskSchema = z.object({
  title: z.string().min(3),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  methodology: z.string().optional(),
  steps: z.array(z.string()).optional().default([]),
  estimatedTime: z.string().optional(),
  inputs: z.array(z.string()).optional().default([]),
  definitionOfDone: z.string().optional(),
  risks: z.array(z.string()).optional().default([]),
});

export const validateAIOutput = <T>(schema: z.ZodSchema<T>, data: unknown): T | null => {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  console.error('AI output validation failed:', result.error);
  return null;
};
