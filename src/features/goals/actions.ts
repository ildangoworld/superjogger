"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recommendNextWeekTarget } from "@/features/goals/next-suggestion";
import { addDaysToLocalDate, getWeekStartDate } from "@/lib/dates/week";
import { createClient } from "@/lib/supabase/server";

export type GoalActionResult = {
  ok: boolean;
  message?: string;
};

const nextWeekGoalSchema = z.object({
  targetCount: z.coerce.number().int().min(1).max(7),
});

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function setNextWeekGoal(
  _prev: GoalActionResult,
  formData: FormData,
): Promise<GoalActionResult> {
  const parsed = nextWeekGoalSchema.safeParse({
    targetCount: formString(formData, "targetCount"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "목표 횟수를 확인해 주세요.",
    };
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

  const currentWeekStart = getWeekStartDate(profile.timezone);
  const nextWeekStart = addDaysToLocalDate(currentWeekStart, 7);

  const [
    { data: preferences },
    { data: currentGoal },
    { data: recentSummary },
  ] = await Promise.all([
    supabase
      .from("user_preferences")
      .select(
        "experience_level, primary_goal, available_weekdays, baseline_weekly_frequency",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("weekly_goals")
      .select("target_count")
      .eq("user_id", user.id)
      .eq("week_start", currentWeekStart)
      .maybeSingle(),
    supabase
      .from("weekly_summaries")
      .select("average_condition, pain_record_count")
      .eq("user_id", user.id)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const recommendation = recommendNextWeekTarget({
    baselineWeeklyFrequency: preferences?.baseline_weekly_frequency ?? null,
    experienceLevel: preferences?.experience_level ?? null,
    primaryGoal: preferences?.primary_goal ?? null,
    availableWeekdays: preferences?.available_weekdays ?? null,
    recentAverageCondition: recentSummary?.average_condition ?? null,
    recentPainCount: recentSummary?.pain_record_count ?? 0,
    currentTargetCount: currentGoal?.target_count ?? null,
  });

  const { error } = await supabase.from("weekly_goals").upsert(
    {
      user_id: user.id,
      week_start: nextWeekStart,
      target_count: parsed.data.targetCount,
      recommended_count: recommendation.recommendedCount,
      recommendation_reason: recommendation.reason,
      confirmed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,week_start" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/profile");

  return {
    ok: true,
    message: `다음 주(${nextWeekStart}부터) 목표를 주 ${parsed.data.targetCount}회로 확정했어요.`,
  };
}
