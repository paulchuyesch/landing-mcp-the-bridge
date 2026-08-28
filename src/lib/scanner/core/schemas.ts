import { z } from "zod";

export const CheckSchema = z.object({
  id: z.string().min(1),
  passed: z.boolean(),
  details: z.string().optional(),
});

export const PillarResultSchema = z.object({
  pillar: z.enum([
    "catalog",
    "semantic",
    "speed",
    "accessibility",
    "ai_enrichment",
  ]),
  score: z.number().min(0),
  maxScore: z.number().min(0),
  checks: z.array(CheckSchema),
});

export const AeoPublicScanResultSchema = z.object({
  url: z.string().url(),
  timestamp: z.string().datetime(),
  totalScore: z.number().min(0).max(100),
  pillars: z.array(PillarResultSchema),
  isSlow: z.boolean().optional(),
  botAccess: z.boolean().optional(),
  accessBlocked: z.boolean().optional(),
});

export type Check = z.infer<typeof CheckSchema>;
export type PillarResult = z.infer<typeof PillarResultSchema>;
export type AeoPublicScanResult = z.infer<typeof AeoPublicScanResultSchema>;
