"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { runWorkoutAnalysis } from "@/features/analysis/run-analysis";
import { PROMPT_VERSION } from "@/features/analysis/schema";
import { reserveAnalysisSlot } from "@/features/analysis/usage";
import { formatLocalDate } from "@/lib/dates/week";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export type ReanalyzeActionResult = {
  ok: boolean;
  message?: string;
};

export async function reanalyzeWorkout(
  workoutId: string,
): Promise<ReanalyzeActionResult> {
  if (!workoutId) {
    return { ok: false, message: "운동 기록을 찾지 못했어요." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "로그인이 필요해요." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { ok: false, message: "프로필을 불러오지 못했어요." };
  }

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (workoutError || !workout) {
    return { ok: false, message: "운동 기록을 찾지 못했어요." };
  }

  const requestKey = `reanalyze:${workoutId}:${crypto.randomUUID()}`;
  const reserved = await reserveAnalysisSlot(supabase, {
    userId: user.id,
    workoutId,
    usageLocalDate: formatLocalDate(profile.timezone),
    triggerType: "REANALYZE",
    requestKey,
    promptVersion: PROMPT_VERSION,
  });

  if (!reserved.ok) {
    if (reserved.reason === "LIMIT") {
      return {
        ok: false,
        message:
          "오늘 제공되는 AI 분석 횟수를 모두 사용했어요. 내일부터 다시 분석을 이용할 수 있어요.",
      };
    }
    return {
      ok: false,
      message: reserved.message ?? "다시 분석하지 못했어요.",
    };
  }

  const userId = user.id;
  const timezone = profile.timezone;

  after(async () => {
    try {
      const admin = createServiceRoleClient();
      await runWorkoutAnalysis({
        supabase: admin,
        userId,
        workoutId,
        timezone,
        triggerType: "REANALYZE",
        requestKey,
      });
      revalidatePath(`/workouts/${workoutId}`);
      revalidatePath("/workouts");
      revalidatePath("/");
    } catch {
      // Keep the pending/failed analysis row; user can retry.
    }
  });

  revalidatePath(`/workouts/${workoutId}`);

  return {
    ok: true,
    message: "분석을 시작했어요. 완료되면 이 화면에 결과가 나타나요.",
  };
}
