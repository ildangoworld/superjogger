import { addDaysToLocalDate, getWeekStartDate } from "@/lib/dates/week";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Supabase = SupabaseClient<Database>;

export type AnalysisContext = {
  recommendationDetail: "LIGHT" | "DETAILED";
  currentWorkout: Record<string, unknown>;
  recentWorkouts: Array<Record<string, unknown>>;
  recentFourWeekSummaries: Array<Record<string, unknown>>;
  recentPainSummary: {
    painRecordCount: number;
    areas: string[];
  };
  weeklyGoal: {
    weekStart: string;
    targetCount: number | null;
    qualifiedDayCount: number;
  };
  previousTrendSummary: string | null;
};

export async function buildAnalysisContext(
  supabase: Supabase,
  userId: string,
  workoutId: string,
): Promise<AnalysisContext> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, recommendation_detail")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "프로필을 불러오지 못했어요.");
  }

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select(
      "id, category, started_at, local_date, duration_seconds, distance_meters, perceived_exertion, condition_score, has_pain, pain_area, pain_details, average_heart_rate, cadence, step_count, memo, qualifies_by_rule, counts_for_daily_goal",
    )
    .eq("id", workoutId)
    .eq("user_id", userId)
    .maybeSingle();

  if (workoutError || !workout) {
    throw new Error(workoutError?.message ?? "운동 기록을 찾지 못했어요.");
  }

  const currentWeekStart = getWeekStartDate(profile.timezone);
  const fourWeeksAgo = addDaysToLocalDate(currentWeekStart, -21);
  const weekEnd = addDaysToLocalDate(currentWeekStart, 6);

  const [
    { data: recentWorkouts, error: recentError },
    { data: summaries, error: summariesError },
    { data: painRows, error: painError },
    { data: currentGoal, error: goalError },
    { data: trendState, error: trendError },
    { data: qualifiedRows, error: qualifiedError },
  ] = await Promise.all([
    supabase
      .from("workouts")
      .select(
        "id, category, local_date, duration_seconds, distance_meters, perceived_exertion, condition_score, has_pain, pain_area, average_heart_rate, cadence, qualifies_by_rule, counts_for_daily_goal",
      )
      .eq("user_id", userId)
      .neq("id", workoutId)
      .order("started_at", { ascending: false })
      .limit(5),
    supabase
      .from("weekly_summaries")
      .select(
        "week_start, goal_count, qualified_day_count, goal_achieved, workout_count, total_duration_seconds, total_distance_meters, category_counts, average_exertion, average_condition, pain_record_count",
      )
      .eq("user_id", userId)
      .gte("week_start", fourWeeksAgo)
      .lte("week_start", currentWeekStart)
      .order("week_start", { ascending: false }),
    supabase
      .from("workouts")
      .select("pain_area, local_date")
      .eq("user_id", userId)
      .eq("has_pain", true)
      .order("started_at", { ascending: false })
      .limit(20),
    supabase
      .from("weekly_goals")
      .select("week_start, target_count")
      .eq("user_id", userId)
      .eq("week_start", currentWeekStart)
      .maybeSingle(),
    supabase
      .from("user_trend_state")
      .select("latest_trend_summary")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("workouts")
      .select("local_date")
      .eq("user_id", userId)
      .eq("counts_for_daily_goal", true)
      .gte("local_date", currentWeekStart)
      .lte("local_date", weekEnd),
  ]);

  if (recentError) throw new Error(recentError.message);
  if (summariesError) throw new Error(summariesError.message);
  if (painError) throw new Error(painError.message);
  if (goalError) throw new Error(goalError.message);
  if (trendError) throw new Error(trendError.message);
  if (qualifiedError) throw new Error(qualifiedError.message);

  const areas = [
    ...new Set(
      (painRows ?? [])
        .map((row) => row.pain_area)
        .filter((area): area is string => Boolean(area)),
    ),
  ];

  return {
    recommendationDetail: profile.recommendation_detail,
    currentWorkout: {
      ...workout,
      qualifiesByRule: workout.qualifies_by_rule,
      countsForDailyGoal: workout.counts_for_daily_goal,
    },
    recentWorkouts: recentWorkouts ?? [],
    recentFourWeekSummaries: summaries ?? [],
    recentPainSummary: {
      painRecordCount: painRows?.length ?? 0,
      areas,
    },
    weeklyGoal: {
      weekStart: currentWeekStart,
      targetCount: currentGoal?.target_count ?? null,
      qualifiedDayCount: new Set(
        (qualifiedRows ?? []).map((row) => row.local_date),
      ).size,
    },
    previousTrendSummary: trendState?.latest_trend_summary ?? null,
  };
}
