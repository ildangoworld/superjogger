import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { WeekSummaryView } from "@/features/workouts/components/recent-weeks-summary";
import { WorkoutsHeaderStats } from "@/features/workouts/components/workouts-header-stats";
import { WorkoutsOverview } from "@/features/workouts/components/workouts-overview";
import { formatDistanceKm } from "@/features/workouts/format";
import {
  calculateWeekGoalStreak,
  type WeekGoalOutcome,
} from "@/features/workouts/stats";
import type { WorkoutCategory } from "@/features/workouts/types";
import {
  addDaysToLocalDate,
  formatLocalDate,
  getWeekStartDate,
  getYearMonthFromLocalDate,
  listRecentWeekStarts,
} from "@/lib/dates/week";
import type { Json } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "기록" };

function emptyCategoryCounts(): Record<WorkoutCategory, number> {
  return { RUNNING: 0, WALKING: 0, MIXED: 0 };
}

function parseCategoryCounts(value: Json): Record<WorkoutCategory, number> {
  const counts = emptyCategoryCounts();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return counts;
  }
  const record = value as Record<string, unknown>;
  for (const category of Object.keys(counts) as WorkoutCategory[]) {
    const raw = record[category];
    if (typeof raw === "number" && Number.isFinite(raw)) {
      counts[category] = raw;
    }
  }
  return counts;
}

function buildWeekViews(
  weekStarts: string[],
  rows: Array<{
    week_start: string;
    workout_count: number;
    qualified_day_count: number;
    goal_count: number;
    goal_achieved: boolean;
    total_duration_seconds: number;
    total_distance_meters: number;
    category_counts: Json;
  }>,
): WeekSummaryView[] {
  const byStart = new Map(rows.map((row) => [row.week_start, row]));
  return weekStarts.map((weekStart) => {
    const row = byStart.get(weekStart);
    if (!row) {
      return {
        weekStart,
        workoutCount: 0,
        qualifiedDayCount: 0,
        goalCount: 0,
        goalAchieved: false,
        totalDurationSeconds: 0,
        totalDistanceMeters: 0,
        categoryCounts: emptyCategoryCounts(),
      };
    }
    return {
      weekStart,
      workoutCount: row.workout_count,
      qualifiedDayCount: row.qualified_day_count,
      goalCount: row.goal_count,
      goalAchieved: row.goal_achieved,
      totalDurationSeconds: row.total_duration_seconds,
      totalDistanceMeters: row.total_distance_meters,
      categoryCounts: parseCategoryCounts(row.category_counts),
    };
  });
}

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: workouts, error }] = await Promise.all([
    supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("workouts")
      .select(
        "id, category, local_date, started_at, duration_seconds, distance_meters, qualifies_by_rule",
      )
      .eq("user_id", user.id)
      .order("started_at", { ascending: false }),
  ]);

  if (error) {
    return (
      <p className="text-muted mt-8 text-sm">
        기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
      </p>
    );
  }

  const timezone = profile?.timezone ?? "Asia/Seoul";
  const todayLocal = formatLocalDate(timezone);
  const currentWeekStart = getWeekStartDate(timezone);
  const weekStarts = listRecentWeekStarts(currentWeekStart, 4);
  const fourWeeksAgo = addDaysToLocalDate(currentWeekStart, -21);
  const streakLookbackStart = addDaysToLocalDate(currentWeekStart, -7 * 51);

  const [summariesResult, trendResult, currentGoalResult] = await Promise.all([
    supabase
      .from("weekly_summaries")
      .select(
        "week_start, workout_count, qualified_day_count, goal_count, goal_achieved, total_duration_seconds, total_distance_meters, category_counts",
      )
      .eq("user_id", user.id)
      .gte("week_start", streakLookbackStart)
      .lte("week_start", currentWeekStart)
      .order("week_start", { ascending: true }),
    supabase
      .from("user_trend_state")
      .select("latest_trend_summary")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("weekly_goals")
      .select("target_count")
      .eq("user_id", user.id)
      .eq("week_start", currentWeekStart)
      .maybeSingle(),
  ]);

  const summaryRows = summariesResult.data ?? [];
  const recentSummaryRows = summaryRows.filter(
    (row) => row.week_start >= fourWeeksAgo,
  );
  const weeks = buildWeekViews(weekStarts, recentSummaryRows);
  const trendSummary = trendResult.data?.latest_trend_summary ?? null;
  const thisWeek = weeks[weeks.length - 1];
  const currentTargetCount = currentGoalResult.data?.target_count ?? 0;
  const qualifiedDayCount = thisWeek?.qualifiedDayCount ?? 0;
  const weekGoalLabel =
    currentTargetCount > 0
      ? `${qualifiedDayCount}/${currentTargetCount}일`
      : "미설정";

  const streakOutcomes: WeekGoalOutcome[] = summaryRows.map((row) => ({
    weekStart: row.week_start,
    goalCount: row.goal_count,
    qualifiedDayCount: row.qualified_day_count,
  }));
  if (currentTargetCount > 0) {
    const currentIndex = streakOutcomes.findIndex(
      (outcome) => outcome.weekStart === currentWeekStart,
    );
    if (currentIndex >= 0) {
      streakOutcomes[currentIndex] = {
        ...streakOutcomes[currentIndex],
        goalCount: currentTargetCount,
      };
    } else {
      streakOutcomes.push({
        weekStart: currentWeekStart,
        goalCount: currentTargetCount,
        qualifiedDayCount,
      });
    }
  }

  const weekStreak = calculateWeekGoalStreak({
    currentWeekStart,
    outcomes: streakOutcomes,
  });

  const workoutRows = workouts ?? [];
  const currentYearMonth = getYearMonthFromLocalDate(todayLocal);
  const monthDistanceMeters = workoutRows.reduce((sum, workout) => {
    if (!workout.local_date.startsWith(currentYearMonth)) {
      return sum;
    }
    return sum + workout.distance_meters;
  }, 0);
  const totalDistanceMeters = workoutRows.reduce(
    (sum, workout) => sum + workout.distance_meters,
    0,
  );

  const headerStats = [
    {
      id: "week-goal",
      value: weekGoalLabel,
      label: "이번 주 목표",
      hint:
        currentTargetCount > 0
          ? `이번 주 목표 ${currentTargetCount}일 중 ${qualifiedDayCount}일을 인정받았어요.`
          : "이번 주 목표가 아직 없어요. 홈에서 주간 목표를 정해 주세요.",
    },
    {
      id: "week-streak",
      value: `${weekStreak}주`,
      label: "연속 성공",
      hint: "주간 목표를 연속으로 달성한 주 수예요. 이번 주가 아직이면 지난주부터 세요.",
    },
    {
      id: "month-distance",
      value: formatDistanceKm(monthDistanceMeters),
      label: "이번 달",
      hint: "이번 달에 기록한 총 거리예요.",
    },
    {
      id: "total-distance",
      value: formatDistanceKm(totalDistanceMeters),
      label: "총 거리",
      hint: "지금까지 기록한 총 거리예요.",
    },
  ];

  // Keep recent-4-week cards aligned with the live current-week goal when present.
  if (currentTargetCount > 0 && thisWeek) {
    thisWeek.goalCount = currentTargetCount;
    thisWeek.goalAchieved = qualifiedDayCount >= currentTargetCount;
  }

  return (
    <div className="pt-6 pb-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-pine-900 text-2xl font-semibold">기록</h1>
        <Link
          href="/record"
          className="bg-pine-800 text-fog-50 hover:bg-pine-700 inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold"
        >
          기록하기
        </Link>
      </div>

      <WorkoutsHeaderStats items={headerStats} />

      {params.deleted ? (
        <p className="border-pine-200 bg-pine-50 text-pine-800 mt-4 rounded-lg border px-3 py-2 text-sm">
          기록을 삭제했고, 목표 반영을 다시 계산했어요.
        </p>
      ) : null}

      <WorkoutsOverview
        todayLocal={todayLocal}
        timezone={timezone}
        workouts={workoutRows}
        weeks={weeks}
        trendSummary={trendSummary}
      />
    </div>
  );
}
