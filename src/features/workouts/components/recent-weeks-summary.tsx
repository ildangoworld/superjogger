import {
  formatCategory,
  formatDistanceKm,
  formatDuration,
} from "@/features/workouts/format";
import type { WorkoutCategory } from "@/features/workouts/types";
import { WORKOUT_CATEGORY_LABELS } from "@/features/workouts/types";
import { addDaysToLocalDate } from "@/lib/dates/week";

export type WeekSummaryView = {
  weekStart: string;
  workoutCount: number;
  qualifiedDayCount: number;
  goalCount: number;
  goalAchieved: boolean;
  totalDurationSeconds: number;
  totalDistanceMeters: number;
  categoryCounts: Record<WorkoutCategory, number>;
};

function formatWeekRange(weekStart: string): string {
  const weekEnd = addDaysToLocalDate(weekStart, 6);
  const startLabel = weekStart.slice(5).replace("-", "/");
  const endLabel = weekEnd.slice(5).replace("-", "/");
  return `${startLabel}–${endLabel}`;
}

function weekRelativeLabel(indexFromNewest: number): string {
  if (indexFromNewest === 0) {
    return "이번 주";
  }
  return `${indexFromNewest}주 전`;
}

function formatCategoryShare(
  counts: Record<WorkoutCategory, number>,
): string | null {
  const total = counts.RUNNING + counts.WALKING + counts.MIXED;
  if (total === 0) {
    return null;
  }
  return (Object.keys(WORKOUT_CATEGORY_LABELS) as WorkoutCategory[])
    .filter((category) => counts[category] > 0)
    .map(
      (category) =>
        `${formatCategory(category)} ${Math.round((counts[category] / total) * 100)}%`,
    )
    .join(" · ");
}

function formatGoalLine(week: WeekSummaryView): string {
  if (week.goalCount <= 0) {
    return week.qualifiedDayCount > 0
      ? `목표 없음 · ${week.qualifiedDayCount}일 운동`
      : "목표 없음";
  }
  return `${week.goalCount}일 목표 중 ${week.qualifiedDayCount}일 달성`;
}

export function RecentWeeksSummary({
  weeks,
  trendSummary,
}: {
  weeks: WeekSummaryView[];
  trendSummary: string | null;
}) {
  return (
    <section className="border-line mt-10 border-t pt-10">
      <h2 className="text-pine-900 text-lg font-semibold">최근 4주</h2>

      {trendSummary ? (
        <p className="text-pine-900 mt-4 text-sm leading-6">{trendSummary}</p>
      ) : null}

      <ul className="mt-5 flex flex-col gap-5">
        {weeks.map((week, index) => {
          const share = formatCategoryShare(week.categoryCounts);
          return (
            <li
              key={week.weekStart}
              className="border-line border-t pt-4 first:border-t-0 first:pt-0"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-pine-900 font-medium">
                  {weekRelativeLabel(index)}
                </p>
                <p className="text-muted text-xs">
                  {formatWeekRange(week.weekStart)}
                </p>
              </div>
              {week.workoutCount === 0 ? (
                <p className="text-muted mt-2 text-sm">
                  이 주에는 기록이 없어요.
                </p>
              ) : (
                <>
                  <p className="text-pine-900 mt-2 text-sm">
                    {week.workoutCount}회 ·{" "}
                    {formatDuration(week.totalDurationSeconds)} ·{" "}
                    {formatDistanceKm(week.totalDistanceMeters)}
                  </p>
                  <p className="text-muted mt-1 text-sm">
                    {formatGoalLine(week)}
                  </p>
                  {share ? (
                    <p className="text-muted mt-1 text-sm">{share}</p>
                  ) : null}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
