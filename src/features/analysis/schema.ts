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

export function remainingAnalysisSlots(
  used: number,
  limit: number = DAILY_ANALYSIS_LIMIT,
): number {
  return Math.max(0, limit - used);
}

/** Auto-analysis starts only when at least one daily slot remains. */
export function shouldStartAutoAnalysis(remainingSlots: number): boolean {
  return remainingSlots > 0;
}

/**
 * Models the RPC advisory-lock path: concurrent requests serialize and
 * never accept more than the daily limit.
 */
export function simulateAtomicReservations(
  initialUsed: number,
  attemptCount: number,
  limit: number = DAILY_ANALYSIS_LIMIT,
): { accepted: number; rejected: number; finalUsed: number } {
  let used = Math.max(0, initialUsed);
  let accepted = 0;
  let rejected = 0;

  for (let i = 0; i < attemptCount; i += 1) {
    if (used < limit) {
      used += 1;
      accepted += 1;
    } else {
      rejected += 1;
    }
  }

  return { accepted, rejected, finalUsed: used };
}
