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
  confidence: z.enum(['profile', 'mixed', 'memory']).default('profile'),
  nextAction: z.string().default(''),
});

export const DimensionContextSnapshotSchema = z.object({
  dimension: z.string(),
  score: z.number().min(0).max(100).default(50),
  trend: z.enum(['up', 'down', 'stable']).default('stable'),
  delta: z.number().default(0),
  status: z.enum(['critical', 'warning', 'stable', 'strong']).default('stable'),
  insight: z.string().default(''),
  gap: z.string().default(''),
  nextStep: z.string().default(''),
  projection: z.string().optional(),
  swot: z
    .object({
      strengths: z.array(z.string()).default([]),
      weaknesses: z.array(z.string()).default([]),
      opportunities: z.array(z.string()).default([]),
      threats: z.array(z.string()).default([]),
    })
    .default({
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
    }),
  scoreExplanation: z
    .object({
      summary: z.string().default(''),
      drivers: z.array(z.string()).default([]),
      peerComparison: z.string().default(''),
      confidence: z.enum(['low', 'medium', 'high']).default('low'),
    })
    .default({
      summary: '',
      drivers: [],
      peerComparison: '',
      confidence: 'low',
    }),
  missingData: z.array(z.string()).default([]),
  fidelityLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).default(0),
  generatedAt: z.string().default(''),
  triggeredBy: z.enum(['manual', 'tier1', 'tier2', 'cold_start']).default('manual'),
});

export const CriticalPrioritySchema = z.object({
  id: z.string().default(''),
  title: z.string().default(''),
  reason: z.string().default(''),
  dimension: z.string().default('Personal'),
  urgency: z.enum(['high', 'medium', 'low']).default('medium'),
});

export const ProfileGapSchema = z.object({
  dimension: z.string().default('Personal'),
  id: z.string().default(''),
  section: z.string().default(''),
  field: z.string().default(''),
  reason: z.string().default(''),
  prompt: z.string().default(''),
  impact: z.enum(['high', 'medium', 'low']).default('medium'),
});

export const LifeSnapshotSynthesisSchema = z.object({
  narrativeParagraph: z.string().default(''),
  criticalPriorities: z.array(CriticalPrioritySchema).default([]),
  profileGaps: z.array(ProfileGapSchema).default([]),
});

export const validateAIOutput = <T>(schema: z.ZodSchema<T>, data: unknown): T | null => {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  console.error('AI output validation failed:', result.error);
  return null;
};
