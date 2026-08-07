"use server";

import { revalidatePath } from "next/cache";
import { runWorkoutAnalysis } from "@/features/analysis/run-analysis";
import { createClient } from "@/lib/supabase/server";

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

  const result = await runWorkoutAnalysis({
    supabase,
    userId: user.id,
    workoutId,
    timezone: profile.timezone,
    triggerType: "REANALYZE",
    requestKey: `reanalyze:${workoutId}:${crypto.randomUUID()}`,
  });

  if (!result.ok) {
    if (result.reason === "LIMIT") {
      return {
        ok: false,
        message:
          "오늘 제공되는 AI 분석 3회를 모두 사용했어요. 내일부터 다시 분석을 이용할 수 있어요.",
      };
    }
    return {
      ok: false,
      message: result.message ?? "다시 분석하지 못했어요.",
    };
  }

  revalidatePath(`/workouts/${workoutId}`);
  revalidatePath("/workouts");
  revalidatePath("/");

  return { ok: true, message: "분석을 업데이트했어요." };
}
