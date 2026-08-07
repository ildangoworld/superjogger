import { buildAnalysisContext } from "@/features/analysis/context";
import { callWorkoutAnalysisProvider } from "@/features/analysis/provider";
import { PROMPT_VERSION } from "@/features/analysis/schema";
import type { AnalysisTriggerType } from "@/features/analysis/types";
import {
  finalizeAnalysisUsage,
  reserveAnalysisSlot,
} from "@/features/analysis/usage";
import { formatLocalDate } from "@/lib/dates/week";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Supabase = SupabaseClient<Database>;

export type RunAnalysisInput = {
  supabase: Supabase;
  userId: string;
  workoutId: string;
  timezone: string;
  triggerType: AnalysisTriggerType;
  requestKey: string;
};

export type RunAnalysisResult =
  | { ok: true; analysisId: string }
  | {
      ok: false;
      reason: "LIMIT" | "NOT_FOUND" | "ERROR";
      message?: string;
    };

async function markAnalysisFailed(
  supabase: Supabase,
  analysisId: string,
  modelName: string | null,
): Promise<void> {
  await supabase
    .from("workout_analyses")
    .update({
      status: "FAILED",
      model_name: modelName,
      completed_at: new Date().toISOString(),
    })
    .eq("id", analysisId);
}

export async function runWorkoutAnalysis(
  input: RunAnalysisInput,
): Promise<RunAnalysisResult> {
  const { supabase, userId, workoutId, timezone, triggerType, requestKey } =
    input;

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("id, active_analysis_id")
    .eq("id", workoutId)
    .eq("user_id", userId)
    .maybeSingle();

  if (workoutError) {
    return { ok: false, reason: "ERROR", message: workoutError.message };
  }
  if (!workout) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const usageLocalDate = formatLocalDate(timezone);
  const reserved = await reserveAnalysisSlot(supabase, {
    userId,
    workoutId,
    usageLocalDate,
    triggerType,
    requestKey,
    promptVersion: PROMPT_VERSION,
  });

  if (!reserved.ok) {
    return {
      ok: false,
      reason: reserved.reason,
      message: reserved.message,
    };
  }

  const { analysisId, usageId, status } = reserved;

  if (status === "CONSUMED" || status === "RELEASED") {
    return { ok: true, analysisId };
  }

  let context;
  try {
    context = await buildAnalysisContext(supabase, userId, workoutId);
  } catch (error) {
    await markAnalysisFailed(supabase, analysisId, null);
    await finalizeAnalysisUsage(supabase, usageId, "RELEASED");
    return {
      ok: false,
      reason: "ERROR",
      message:
        error instanceof Error ? error.message : "분석 컨텍스트를 만들지 못했어요.",
    };
  }

  const providerResult = await callWorkoutAnalysisProvider(context);

  if (!providerResult.requestSent) {
    await markAnalysisFailed(supabase, analysisId, providerResult.modelName);
    await finalizeAnalysisUsage(supabase, usageId, "RELEASED");
    return {
      ok: false,
      reason: "ERROR",
      message: providerResult.error,
    };
  }

  if (!providerResult.ok) {
    await markAnalysisFailed(supabase, analysisId, providerResult.modelName);
    await finalizeAnalysisUsage(supabase, usageId, "CONSUMED");
    return {
      ok: false,
      reason: "ERROR",
      message: providerResult.error,
    };
  }

  const result = providerResult.result;
  const completedAt = new Date().toISOString();

  const { error: updateAnalysisError } = await supabase
    .from("workout_analyses")
    .update({
      status: "COMPLETED",
      summary: result.summary,
      intensity_interpretation: result.intensityInterpretation,
      trend: result.trend,
      next_workout_suggestion: result.nextWorkoutSuggestion,
      safety_notice: result.safetyNotice,
      trend_summary: result.trendSummaryForNextAnalysis,
      risk_level: result.riskLevel,
      model_name: providerResult.modelName,
      completed_at: completedAt,
    })
    .eq("id", analysisId)
    .eq("user_id", userId);

  if (updateAnalysisError) {
    await markAnalysisFailed(supabase, analysisId, providerResult.modelName);
    await finalizeAnalysisUsage(supabase, usageId, "CONSUMED");
    return { ok: false, reason: "ERROR", message: updateAnalysisError.message };
  }

  const { error: activeError } = await supabase
    .from("workouts")
    .update({ active_analysis_id: analysisId })
    .eq("id", workoutId)
    .eq("user_id", userId);

  if (activeError) {
    await finalizeAnalysisUsage(supabase, usageId, "CONSUMED");
    return { ok: false, reason: "ERROR", message: activeError.message };
  }

  const { error: trendError } = await supabase.from("user_trend_state").upsert(
    {
      user_id: userId,
      latest_trend_summary: result.trendSummaryForNextAnalysis,
      source_analysis_id: analysisId,
      updated_at: completedAt,
    },
    { onConflict: "user_id" },
  );

  if (trendError) {
    await finalizeAnalysisUsage(supabase, usageId, "CONSUMED");
    return { ok: false, reason: "ERROR", message: trendError.message };
  }

  await finalizeAnalysisUsage(supabase, usageId, "CONSUMED");
  return { ok: true, analysisId };
}

export async function markActiveAnalysisStale(
  supabase: Supabase,
  userId: string,
  workoutId: string,
): Promise<void> {
  const { data: workout } = await supabase
    .from("workouts")
    .select("active_analysis_id")
    .eq("id", workoutId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!workout?.active_analysis_id) {
    return;
  }

  await supabase
    .from("workout_analyses")
    .update({ status: "STALE" })
    .eq("id", workout.active_analysis_id)
    .eq("user_id", userId)
    .eq("status", "COMPLETED");
}
