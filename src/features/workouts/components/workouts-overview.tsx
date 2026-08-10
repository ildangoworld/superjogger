"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { analysisStatusLabel } from "@/features/analysis/format";
import type { AnalysisStatus } from "@/features/analysis/types";
import { RecentWeeksSummary } from "@/features/workouts/components/recent-weeks-summary";
import type { WeekSummaryView } from "@/features/workouts/components/recent-weeks-summary";
import { WorkoutsCalendar } from "@/features/workouts/components/workouts-calendar";
import {
  formatCategory,
  formatDistanceKm,
  formatDuration,
  goalStatusLabel,
} from "@/features/workouts/format";

type WorkoutListItem = {
  id: string;
  category: "RUNNING" | "WALKING" | "MIXED";
  local_date: string;
  duration_seconds: number;
  distance_meters: number;
  qualifies_by_rule: boolean;
  counts_for_daily_goal: boolean;
  active_analysis_id: string | null;
};

export function WorkoutsOverview({
  todayLocal,
  workouts,
  weeks,
  trendSummary,
  remainingSlots,
  statusByAnalysisId,
}: {
  todayLocal: string;
  workouts: WorkoutListItem[];
  weeks: WeekSummaryView[];
  trendSummary: string | null;
  remainingSlots: number;
  statusByAnalysisId: Record<string, AnalysisStatus>;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const countsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const workout of workouts) {
      counts[workout.local_date] = (counts[workout.local_date] ?? 0) + 1;
    }
    return counts;
  }, [workouts]);

  const visibleWorkouts = useMemo(() => {
    if (!selectedDate) {
      return workouts;
    }
    return workouts.filter((workout) => workout.local_date === selectedDate);
  }, [workouts, selectedDate]);

  return (
    <>
      <WorkoutsCalendar
        todayLocal={todayLocal}
        countsByDate={countsByDate}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <RecentWeeksSummary weeks={weeks} trendSummary={trendSummary} />

      <section className="mt-10">
        <h2 className="text-pine-900 text-lg font-semibold">운동 목록</h2>
        {!workouts.length ? (
          <div className="mt-4">
            <p className="text-pine-900 text-base font-medium">
              아직 기록이 없어요
            </p>
            <p className="text-muted mt-2 text-sm leading-6">
              오늘 몸에 맞게 10분부터 움직여보고 기록을 남겨보세요.
            </p>
            <Link
              href="/record"
              className="text-pine-700 mt-4 inline-flex text-sm font-medium underline-offset-4 hover:underline"
            >
              첫 기록 남기기
            </Link>
          </div>
        ) : visibleWorkouts.length === 0 ? (
          <p className="text-muted mt-4 text-sm leading-6">
            선택한 날짜에는 기록이 없어요.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {visibleWorkouts.map((workout) => (
              <li key={workout.id}>
                <Link
                  href={`/workouts/${workout.id}`}
                  className="border-line hover:border-pine-300 block rounded-lg border px-4 py-4 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-pine-900 font-semibold">
                      {formatCategory(workout.category)}
                    </p>
                    <p className="text-muted text-xs">{workout.local_date}</p>
                  </div>
                  <p className="text-muted mt-2 text-sm">
                    {formatDuration(workout.duration_seconds)} ·{" "}
                    {formatDistanceKm(workout.distance_meters)}
                  </p>
                  <p className="text-pine-700 mt-2 text-xs font-medium">
                    {goalStatusLabel({
                      qualifiesByRule: workout.qualifies_by_rule,
                      countsForDailyGoal: workout.counts_for_daily_goal,
                    })}
                    {" · "}
                    {analysisStatusLabel(
                      workout.active_analysis_id
                        ? (statusByAnalysisId[workout.active_analysis_id] ??
                            null)
                        : null,
                      {
                        limitExceeded:
                          !workout.active_analysis_id && remainingSlots <= 0,
                      },
                    )}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
