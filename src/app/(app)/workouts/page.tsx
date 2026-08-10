import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRemainingAnalysisSlots } from "@/features/analysis/usage";
import type { AnalysisStatus } from "@/features/analysis/types";
import type { WeekSummaryView } from "@/features/workouts/components/recent-weeks-summary";
import { WorkoutsOverview } from "@/features/workouts/components/workouts-overview";
import type { WorkoutCategory } from "@/features/workouts/types";
import {
  addDaysToLocalDate,
  formatLocalDate,
  getWeekStartDate,
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
        "id, category, local_date, started_at, duration_seconds, distance_meters, qualifies_by_rule, counts_for_daily_goal, active_analysis_id",
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
  const analysisIds = (workouts ?? [])
    .map((workout) => workout.active_analysis_id)
    .filter((id): id is string => Boolean(id));

  const [remainingSlots, analysesResult, summariesResult, trendResult] =
    await Promise.all([
      getRemainingAnalysisSlots(supabase, user.id, todayLocal),
      analysisIds.length > 0
        ? supabase
            .from("workout_analyses")
            .select("id, status")
            .eq("user_id", user.id)
            .in("id", analysisIds)
        : Promise.resolve({
            data: [] as Array<{ id: string; status: AnalysisStatus }>,
          }),
      supabase
        .from("weekly_summaries")
        .select(
          "week_start, workout_count, qualified_day_count, goal_count, goal_achieved, total_duration_seconds, total_distance_meters, category_counts",
        )
        .eq("user_id", user.id)
        .gte("week_start", fourWeeksAgo)
        .lte("week_start", currentWeekStart)
        .order("week_start", { ascending: true }),
      supabase
        .from("user_trend_state")
        .select("latest_trend_summary")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const statusByAnalysisId: Record<string, AnalysisStatus> = {};
  for (const row of analysesResult.data ?? []) {
    statusByAnalysisId[row.id] = row.status;
  }

  const weeks = buildWeekViews(weekStarts, summariesResult.data ?? []);
  const trendSummary = trendResult.data?.latest_trend_summary ?? null;

  return (
    <div className="pt-6 pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-pine-900 text-2xl font-semibold">기록</h1>
          <p className="text-muted mt-2 text-sm leading-6">
            달력과 최근 4주 변화, 최신 운동을 확인할 수 있어요.
          </p>
        </div>
        <Link
          href="/record"
          className="bg-pine-800 text-fog-50 hover:bg-pine-700 inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold"
        >
          기록하기
        </Link>
      </div>

      {params.deleted ? (
        <p className="border-pine-200 bg-pine-50 text-pine-800 mt-4 rounded-lg border px-3 py-2 text-sm">
          기록을 삭제했고, 목표 반영을 다시 계산했어요.
        </p>
      ) : null}

      <WorkoutsOverview
        todayLocal={todayLocal}
        workouts={workouts ?? []}
        weeks={weeks}
        trendSummary={trendSummary}
        remainingSlots={remainingSlots}
        statusByAnalysisId={statusByAnalysisId}
      />
    </div>
  );
}
