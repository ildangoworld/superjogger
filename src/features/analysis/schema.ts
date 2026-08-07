import { z } from "zod";
import type { WorkoutAnalysisResult } from "@/features/analysis/types";

export const PROMPT_VERSION = "v1";

export const DAILY_ANALYSIS_LIMIT = 3;

export const SCHEMA_RETRY_LIMIT = 2;

export const workoutAnalysisResultSchema = z.object({
  summary: z.string().min(1).max(2000),
  intensityInterpretation: z.string().min(1).max(2000),
  trend: z.string().min(1).max(2000),
  nextWorkoutSuggestion: z.string().min(1).max(2000),
  safetyNotice: z.string().max(2000).nullable(),
  trendSummaryForNextAnalysis: z.string().min(1).max(2000),
  riskLevel: z.enum(["NONE", "CAUTION", "HIGH"]),
});

export function parseWorkoutAnalysisResult(
  value: unknown,
):
  | { ok: true; data: WorkoutAnalysisResult }
  | { ok: false; error: string } {
  const parsed = workoutAnalysisResultSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid analysis schema",
    };
  }
  return { ok: true, data: parsed.data };
}

export function countUsedAnalysisSlots(
  statuses: Array<"RESERVED" | "CONSUMED" | "RELEASED">,
): number {
  return statuses.filter(
    (status) => status === "RESERVED" || status === "CONSUMED",
  ).length;
}

export function remainingAnalysisSlots(used: number): number {
  return Math.max(0, DAILY_ANALYSIS_LIMIT - used);
}
