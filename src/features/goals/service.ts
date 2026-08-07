import {
  calculateJoggerGrade,
  type JoggerGradeResult,
  type WeekOutcome,
} from "@/features/goals/grade";
import {
  recommendNextWeekTarget,
  suggestNextDirection,
  type NextDirectionSuggestion,
} from "@/features/goals/next-suggestion";
import { JOGGER_GRADE_LABELS } from "@/features/goals/types";
import {
  addDaysToLocalDate,
  getWeekStartDate,
  listCompletedWeekStarts,
} from "@/lib/dates/week";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type WeeklyProgress = {
  weekStart: string;
  targetCount: number;
  qualifiedDayCount: number;
  achievementPercent: number;
  goalAchieved: boolean;
};

export type HomeDashboard = {
  nickname: string;
  timezone: string;
  progress: WeeklyProgress | null;
  nextDirection: NextDirectionSuggestion;
  latestWorkout: {
    id: string;
    localDate: string;
    category: "RUNNING" | "WALKING" | "MIXED";
    analysisSummary: string | null;
  } | null;
  grade: JoggerGradeResult;
  gradeLabel: string;
};

export type GoalsSettings = {
  currentWeek: {
    weekStart: string;
    targetCount: number;
    recommendedCount: number | null;
    recommendationReason: string | null;
    qualifiedDayCount: number;
  } | null;
  nextWeek: {
    weekStart: string;
    targetCount: number | null;
    recommendedCount: number;
    recommendationReason: string;
  };
  grade: JoggerGradeResult;
  gradeLabel: string;
};

async function countQualifiedDays(
  supabase: Supabase,
  userId: string,
  weekStart: string,
): Promise<number> {
  const weekEnd = addDaysToLocalDate(weekStart, 6);
  const { data, error } = await supabase
    .from("workouts")
    .select("local_date")
    .eq("user_id", userId)
    .eq("counts_for_daily_goal", true)
    .gte("local_date", weekStart)
    .lte("local_date", weekEnd);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => row.local_date)).size;
}

async function loadWeekOutcomes(
  supabase: Supabase,
  userId: string,
): Promise<{ firstWeekStart: string | null; outcomes: WeekOutcome[] }> {
  const [{ data: goals, error: goalsError }, { data: summaries, error: summariesError }] =
    await Promise.all([
      supabase
        .from("weekly_goals")
        .select("week_start, target_count")
        .eq("user_id", userId)
        .order("week_start", { ascending: true }),
      supabase
        .from("weekly_summaries")
        .select("week_start, goal_count, qualified_day_count")
        .eq("user_id", userId),
    ]);

  if (goalsError) {
    throw new Error(goalsError.message);
  }
  if (summariesError) {
    throw new Error(summariesError.message);
  }

  const summaryByWeek = new Map(
    (summaries ?? []).map((row) => [row.week_start, row]),
  );

  const outcomes: WeekOutcome[] = [];
  for (const goal of goals ?? []) {
    const summary = summaryByWeek.get(goal.week_start);
    const qualifiedDayCount =
      summary?.qualified_day_count ??
      (await countQualifiedDays(supabase, userId, goal.week_start));
    outcomes.push({
      weekStart: goal.week_start,
      goalCount: goal.target_count,
      qualifiedDayCount,
    });
  }

  return {
    firstWeekStart: goals?.[0]?.week_start ?? null,
    outcomes,
  };
}

export async function getJoggerGradeForUser(
  supabase: Supabase,
  userId: string,
  timezone: string,
  now: Date = new Date(),
): Promise<JoggerGradeResult> {
  const currentWeekStart = getWeekStartDate(timezone, now);
  const { firstWeekStart, outcomes } = await loadWeekOutcomes(supabase, userId);
  const completedWeekStarts = firstWeekStart
    ? listCompletedWeekStarts(firstWeekStart, currentWeekStart)
    : [];

  return calculateJoggerGrade({
    completedWeekStarts,
    outcomes,
  });
}

export async function getHomeDashboard(
  supabase: Supabase,
  userId: string,
): Promise<HomeDashboard> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("nickname, timezone, recommendation_detail")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "프로필을 불러오지 못했어요.");
  }

  const timezone = profile.timezone;
  const now = new Date();
  const currentWeekStart = getWeekStartDate(timezone, now);

  const [
    { data: currentGoal },
    qualifiedDayCount,
    { data: latestWorkout },
    grade,
  ] = await Promise.all([
    supabase
      .from("weekly_goals")
      .select("target_count, week_start")
      .eq("user_id", userId)
      .eq("week_start", currentWeekStart)
      .maybeSingle(),
    countQualifiedDays(supabase, userId, currentWeekStart),
    supabase
      .from("workouts")
      .select(
        "id, local_date, category, has_pain, perceived_exertion, condition_score, active_analysis_id",
      )
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getJoggerGradeForUser(supabase, userId, timezone, now),
  ]);

  const progress: WeeklyProgress | null = currentGoal
    ? {
        weekStart: currentWeekStart,
        targetCount: currentGoal.target_count,
        qualifiedDayCount,
        achievementPercent: Math.min(
          100,
          Math.round((qualifiedDayCount / currentGoal.target_count) * 100),
        ),
        goalAchieved: qualifiedDayCount >= currentGoal.target_count,
      }
    : null;

  let analysisSummary: string | null = null;
  let analysisSuggestion: string | null = null;

  if (latestWorkout?.active_analysis_id) {
    const { data: analysis } = await supabase
      .from("workout_analyses")
      .select("status, summary, next_workout_suggestion")
      .eq("id", latestWorkout.active_analysis_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (analysis?.status === "COMPLETED" || analysis?.status === "STALE") {
      analysisSummary = analysis.summary;
      analysisSuggestion = analysis.next_workout_suggestion;
    }
  }

  const ruleBasedDirection = suggestNextDirection({
    recommendationDetail: profile.recommendation_detail,
    lastWorkout: latestWorkout
      ? {
          category: latestWorkout.category,
          hasPain: latestWorkout.has_pain,
          perceivedExertion: latestWorkout.perceived_exertion,
          conditionScore: latestWorkout.condition_score,
        }
      : null,
  });

  const nextDirection: NextDirectionSuggestion = analysisSuggestion
    ? {
        headline: "AI 다음 운동 제안",
        body: analysisSuggestion,
      }
    : ruleBasedDirection;

  return {
    nickname: profile.nickname,
    timezone,
    progress,
    nextDirection,
    latestWorkout: latestWorkout
      ? {
          id: latestWorkout.id,
          localDate: latestWorkout.local_date,
          category: latestWorkout.category,
          analysisSummary,
        }
      : null,
    grade,
    gradeLabel: JOGGER_GRADE_LABELS[grade.grade],
  };
}

export async function getGoalsSettings(
  supabase: Supabase,
  userId: string,
): Promise<GoalsSettings> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "프로필을 불러오지 못했어요.");
  }

  const timezone = profile.timezone;
  const now = new Date();
  const currentWeekStart = getWeekStartDate(timezone, now);
  const nextWeekStart = addDaysToLocalDate(currentWeekStart, 7);

  const [
    { data: currentGoal },
    { data: nextGoal },
    { data: preferences },
    { data: recentSummary },
    qualifiedDayCount,
    grade,
  ] = await Promise.all([
    supabase
      .from("weekly_goals")
      .select("week_start, target_count, recommended_count, recommendation_reason")
      .eq("user_id", userId)
      .eq("week_start", currentWeekStart)
      .maybeSingle(),
    supabase
      .from("weekly_goals")
      .select("week_start, target_count, recommended_count, recommendation_reason")
      .eq("user_id", userId)
      .eq("week_start", nextWeekStart)
      .maybeSingle(),
    supabase
      .from("user_preferences")
      .select(
        "experience_level, primary_goal, available_weekdays, baseline_weekly_frequency",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("weekly_summaries")
      .select("average_condition, pain_record_count, week_start")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
    countQualifiedDays(supabase, userId, currentWeekStart),
    getJoggerGradeForUser(supabase, userId, timezone, now),
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

  return {
    currentWeek: currentGoal
      ? {
          weekStart: currentGoal.week_start,
          targetCount: currentGoal.target_count,
          recommendedCount: currentGoal.recommended_count,
          recommendationReason: currentGoal.recommendation_reason,
          qualifiedDayCount,
        }
      : null,
    nextWeek: {
      weekStart: nextWeekStart,
      targetCount: nextGoal?.target_count ?? null,
      recommendedCount:
        nextGoal?.recommended_count ?? recommendation.recommendedCount,
      recommendationReason:
        nextGoal?.recommendation_reason ?? recommendation.reason,
    },
    grade,
    gradeLabel: JOGGER_GRADE_LABELS[grade.grade],
  };
}
