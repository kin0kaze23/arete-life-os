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

export const BaselineSwotSchema = z.object({
  dimension: z.string(),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  threats: z.array(z.string()).default([]),
  confidence: z.string().optional().default('profile'),
  nextAction: z.string().optional().default('Log a check-in.'),
});

export const LifeContextSignalSchema = z.object({
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  affectedDimensions: z.array(z.string()).default([]),
  reason: z.string().min(3),
});

export const DimensionSwotSchema = z.object({
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  threats: z.array(z.string()).default([]),
});

export const DimensionScoreExplanationSchema = z.object({
  summary: z.string().min(1),
  drivers: z.array(z.string()).default([]),
  peerComparison: z.string().min(1),
  confidence: z.enum(['low', 'medium', 'high']).default('medium'),
});

export const DimensionContextSnapshotSchema = z.object({
  dimension: z.string(),
  status: z.enum(['thriving', 'stable', 'needs_attention', 'critical', 'no_signal']),
  score: z.number().min(0).max(100),
  trend: z.enum(['up', 'down', 'stable']),
  delta: z.number(),
  insight: z.string().min(1),
  gap: z.string().min(1),
  nextStep: z.string().min(1),
  swot: DimensionSwotSchema.optional(),
  scoreExplanation: DimensionScoreExplanationSchema.optional(),
  projection: z.string().optional(),
  missingData: z.array(z.string()).optional().default([]),
  fidelityLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  generatedAt: z.string().min(4),
  triggeredBy: z.string().optional(),
});

export const CriticalPrioritySchema = z.object({
  dimension: z.string(),
  title: z.string().min(1),
  rationale: z.string().min(1),
  consequence: z.string().min(1),
});

export const ProfileGapSchema = z.object({
  field: z.string().min(1),
  dimension: z.string(),
  prompt: z.string().min(1),
  impactDescription: z.string().min(1),
});

export const LifeSnapshotSynthesisSchema = z.object({
  narrativeParagraph: z.string().min(1),
  criticalPriorities: z.array(CriticalPrioritySchema).default([]),
  profileGaps: z.array(ProfileGapSchema).default([]),
});

export const validateAIOutput = <T>(schema: z.ZodSchema<T>, data: unknown): T | null => {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  console.error('AI output validation failed:', result.error);
  return null;
};
