import {
  DAILY_ANALYSIS_LIMIT,
  remainingAnalysisSlots,
} from "@/features/analysis/schema";
import type {
  AnalysisTriggerType,
  AnalysisUsageStatus,
} from "@/features/analysis/types";
import { getAiDailyLimit } from "@/features/settings/queries";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Supabase = SupabaseClient<Database>;

export type ReserveSlotResult =
  | {
      ok: true;
      analysisId: string;
      usageId: string;
      idempotent: boolean;
      status: string;
    }
  | {
      ok: false;
      reason: "LIMIT" | "NOT_FOUND" | "ERROR";
      message?: string;
    };

type RpcReserveResult = {
  ok?: boolean;
  analysis_id?: string;
  usage_id?: string;
  idempotent?: boolean;
  status?: string;
  reason?: string;
};

export async function getUsedAnalysisCount(
  supabase: Supabase,
  userId: string,
  usageLocalDate: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("ai_analysis_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("usage_local_date", usageLocalDate)
    .in("status", ["RESERVED", "CONSUMED"]);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getRemainingAnalysisSlots(
  supabase: Supabase,
  userId: string,
  usageLocalDate: string,
): Promise<number> {
  const [used, limit] = await Promise.all([
    getUsedAnalysisCount(supabase, userId, usageLocalDate),
    getAiDailyLimit(supabase).catch(() => DAILY_ANALYSIS_LIMIT),
  ]);
  return remainingAnalysisSlots(used, limit);
}

export async function reserveAnalysisSlot(
  supabase: Supabase,
  input: {
    userId: string;
    workoutId: string;
    usageLocalDate: string;
    triggerType: AnalysisTriggerType;
    requestKey: string;
    promptVersion: string;
  },
): Promise<ReserveSlotResult> {
  const { data, error } = await supabase.rpc("reserve_ai_analysis_slot", {
    p_user_id: input.userId,
    p_workout_id: input.workoutId,
    p_usage_local_date: input.usageLocalDate,
    p_trigger_type: input.triggerType,
    p_request_key: input.requestKey,
    p_prompt_version: input.promptVersion,
  });

  if (error) {
    return { ok: false, reason: "ERROR", message: error.message };
  }

  const result = data as RpcReserveResult;
  if (!result?.ok) {
    if (result?.reason === "LIMIT") {
      return { ok: false, reason: "LIMIT" };
    }
    if (result?.reason === "NOT_FOUND") {
      return { ok: false, reason: "NOT_FOUND" };
    }
    return { ok: false, reason: "ERROR", message: "슬롯을 예약하지 못했어요." };
  }

  if (!result.analysis_id || !result.usage_id) {
    return { ok: false, reason: "ERROR", message: "슬롯 응답이 올바르지 않아요." };
  }

  return {
    ok: true,
    analysisId: result.analysis_id,
    usageId: result.usage_id,
    idempotent: Boolean(result.idempotent),
    status: result.status ?? "RESERVED",
  };
}

export async function finalizeAnalysisUsage(
  supabase: Supabase,
  usageId: string,
  status: Extract<AnalysisUsageStatus, "CONSUMED" | "RELEASED">,
): Promise<void> {
  const { data, error } = await supabase.rpc("finalize_ai_analysis_usage", {
    p_usage_id: usageId,
    p_status: status,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = data as { ok?: boolean; reason?: string };
  if (!result?.ok) {
    throw new Error(result?.reason ?? "사용량을 확정하지 못했어요.");
  }
}

export { DAILY_ANALYSIS_LIMIT };
