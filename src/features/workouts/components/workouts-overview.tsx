"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RecentWeeksSummary } from "@/features/workouts/components/recent-weeks-summary";
import type { WeekSummaryView } from "@/features/workouts/components/recent-weeks-summary";
import { WorkoutsCalendar } from "@/features/workouts/components/workouts-calendar";
import {
  formatCategory,
  formatDistanceKm,
  formatDuration,
  formatLocalDateTimeLabel,
  workoutListAlertLabel,
} from "@/features/workouts/format";

type WorkoutListItem = {
  id: string;
  category: "RUNNING" | "WALKING" | "MIXED";
  local_date: string;
  started_at: string;
  duration_seconds: number;
  distance_meters: number;
  qualifies_by_rule: boolean;
};

export function WorkoutsOverview({
  todayLocal,
  timezone,
  workouts,
  weeks,
  trendSummary,
}: {
  todayLocal: string;
  timezone: string;
  workouts: WorkoutListItem[];
  weeks: WeekSummaryView[];
  trendSummary: string | null;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(todayLocal);

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

  const weeksNewestFirst = useMemo(() => [...weeks].reverse(), [weeks]);

  return (
    <>
      <WorkoutsCalendar
        todayLocal={todayLocal}
        countsByDate={countsByDate}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-pine-900 text-lg font-semibold">운동 목록</h2>
          {selectedDate ? (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-pine-700 text-sm font-medium underline-offset-4 hover:underline"
            >
              전체 보기
            </button>
          ) : null}
        </div>
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
            {visibleWorkouts.map((workout) => {
              const alertLabel = workoutListAlertLabel(
                workout.qualifies_by_rule,
              );
              return (
                <li key={workout.id}>
                  <Link
                    href={`/workouts/${workout.id}`}
                    className="border-line hover:border-pine-300 block rounded-lg border px-4 py-4 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-pine-900 font-semibold">
                        {formatCategory(workout.category)}
                      </p>
                      <p className="text-muted text-xs">
                        {formatLocalDateTimeLabel(
                          workout.local_date,
                          workout.started_at,
                          timezone,
                        )}
                      </p>
                    </div>
                    <p className="text-muted mt-2 text-sm">
                      {formatDuration(workout.duration_seconds)} ·{" "}
                      {formatDistanceKm(workout.distance_meters)}
                    </p>
                    {alertLabel ? (
                      <p className="text-dawn-900 mt-2 text-xs font-medium">
                        {alertLabel}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <RecentWeeksSummary
        weeks={weeksNewestFirst}
        trendSummary={trendSummary}
      />
    </>
  );
}
