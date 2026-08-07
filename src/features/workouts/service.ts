import type { Database, Json } from "@/lib/database.types";
import {
  assignCountsForDailyGoal,
  qualifiesByRule,
} from "@/features/workouts/qualification";
import { getWeekStartFromLocalDateString } from "@/lib/dates/week";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"];

type CategoryCounts = {
  RUNNING: number;
  WALKING: number;
  MIXED: number;
};

function emptyCategoryCounts(): CategoryCounts {
  return { RUNNING: 0, WALKING: 0, MIXED: 0 };
}

export async function reassignDailyGoalFlags(
  supabase: Supabase,
  userId: string,
  localDates: string[],
): Promise<void> {
  const uniqueDates = [...new Set(localDates)].filter(Boolean);
  if (uniqueDates.length === 0) {
    return;
  }

  const { data, error } = await supabase
    .from("workouts")
    .select("id, local_date, qualifies_by_rule, created_at")
    .eq("user_id", userId)
    .in("local_date", uniqueDates);

  if (error) {
    throw new Error(error.message);
  }

  const workouts = data ?? [];
  const flags = assignCountsForDailyGoal(
    workouts.map((row) => ({
      id: row.id,
      localDate: row.local_date,
      qualifiesByRule: row.qualifies_by_rule,
      createdAt: row.created_at,
    })),
  );

  for (const row of workouts) {
    const next = flags.get(row.id) ?? false;
    const { error: updateError } = await supabase
      .from("workouts")
      .update({ counts_for_daily_goal: next })
      .eq("id", row.id)
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}

export async function refreshWeeklySummaries(
  supabase: Supabase,
  userId: string,
  localDates: string[],
): Promise<void> {
  const weekStarts = [
    ...new Set(
      [...new Set(localDates)]
        .filter(Boolean)
        .map((localDate) => getWeekStartFromLocalDateString(localDate)),
    ),
  ];

  for (const weekStart of weekStarts) {
    await refreshWeeklySummaryForWeek(supabase, userId, weekStart);
  }
}

async function refreshWeeklySummaryForWeek(
  supabase: Supabase,
  userId: string,
  weekStart: string,
): Promise<void> {
  const weekEndDate = addDays(weekStart, 6);

  const [{ data: workouts, error: workoutsError }, { data: goal, error: goalError }] =
    await Promise.all([
      supabase
        .from("workouts")
        .select(
          "category, duration_seconds, distance_meters, perceived_exertion, condition_score, has_pain, counts_for_daily_goal, local_date",
        )
        .eq("user_id", userId)
        .gte("local_date", weekStart)
        .lte("local_date", weekEndDate),
      supabase
        .from("weekly_goals")
        .select("target_count")
        .eq("user_id", userId)
        .eq("week_start", weekStart)
        .maybeSingle(),
    ]);

  if (workoutsError) {
    throw new Error(workoutsError.message);
  }
  if (goalError) {
    throw new Error(goalError.message);
  }

  const rows = workouts ?? [];
  const goalCount = goal?.target_count ?? 0;
  const qualifiedDays = new Set(
    rows
      .filter((row) => row.counts_for_daily_goal)
      .map((row) => row.local_date),
  );
  const qualifiedDayCount = qualifiedDays.size;
  const categoryCounts = emptyCategoryCounts();
  let totalDuration = 0;
  let totalDistance = 0;
  let exertionSum = 0;
  let conditionSum = 0;
  let painCount = 0;

  for (const row of rows) {
    categoryCounts[row.category] += 1;
    totalDuration += row.duration_seconds;
    totalDistance += row.distance_meters;
    exertionSum += row.perceived_exertion;
    conditionSum += row.condition_score;
    if (row.has_pain) {
      painCount += 1;
    }
  }

  const workoutCount = rows.length;
  const payload = {
    user_id: userId,
    week_start: weekStart,
    goal_count: goalCount,
    qualified_day_count: qualifiedDayCount,
    goal_achieved: goalCount > 0 && qualifiedDayCount >= goalCount,
    workout_count: workoutCount,
    total_duration_seconds: totalDuration,
    total_distance_meters: totalDistance,
    category_counts: categoryCounts as unknown as Json,
    average_exertion: workoutCount > 0 ? exertionSum / workoutCount : null,
    average_condition: workoutCount > 0 ? conditionSum / workoutCount : null,
    pain_record_count: painCount,
  };

  if (workoutCount === 0 && !goal) {
    await supabase
      .from("weekly_summaries")
      .delete()
      .eq("user_id", userId)
      .eq("week_start", weekStart);
    return;
  }

  const { error: upsertError } = await supabase
    .from("weekly_summaries")
    .upsert(payload, { onConflict: "user_id,week_start" });

  if (upsertError) {
    throw new Error(upsertError.message);
  }
}

function addDays(localDate: string, days: number): string {
  const [year, month, day] = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return date.toISOString().slice(0, 10);
}

export function computeQualificationFlags(input: {
  durationSeconds: number;
  distanceMeters: number;
  localDate: string;
  existingSameDay: Pick<
    WorkoutRow,
    "id" | "qualifies_by_rule" | "counts_for_daily_goal" | "created_at"
  >[];
  workoutId?: string;
  createdAt?: string;
}): { qualifiesByRule: boolean; countsForDailyGoal: boolean } {
  const qualifies = qualifiesByRule(
    input.durationSeconds,
    input.distanceMeters,
  );

  if (!qualifies) {
    return { qualifiesByRule: false, countsForDailyGoal: false };
  }

  const candidates = [
    ...input.existingSameDay.map((row) => ({
      id: row.id,
      localDate: input.localDate,
      qualifiesByRule: row.qualifies_by_rule,
      createdAt: row.created_at,
    })),
  ];

  if (input.workoutId) {
    const withoutSelf = candidates.filter((row) => row.id !== input.workoutId);
    withoutSelf.push({
      id: input.workoutId,
      localDate: input.localDate,
      qualifiesByRule: true,
      createdAt: input.createdAt ?? new Date().toISOString(),
    });
    const flags = assignCountsForDailyGoal(withoutSelf);
    return {
      qualifiesByRule: true,
      countsForDailyGoal: flags.get(input.workoutId) ?? false,
    };
  }

  const alreadyCounted = input.existingSameDay.some(
    (row) => row.counts_for_daily_goal,
  );
  return {
    qualifiesByRule: true,
    countsForDailyGoal: !alreadyCounted,
  };
}
