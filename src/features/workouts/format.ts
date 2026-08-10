import type { WorkoutCategory } from "@/features/workouts/types";
import { WORKOUT_CATEGORY_LABELS } from "@/features/workouts/types";
import {
  metersToKilometers,
  secondsToDurationParts,
} from "@/features/workouts/qualification";

export function formatDistanceKm(meters: number): string {
  const km = metersToKilometers(meters);
  return `${Number(km.toFixed(2))}km`;
}

export function formatDuration(totalSeconds: number): string {
  const { hours, minutes, seconds } = secondsToDurationParts(totalSeconds);
  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${seconds}초`;
  }
  if (minutes > 0) {
    return `${minutes}분 ${seconds}초`;
  }
  return `${seconds}초`;
}

export function formatCategory(category: WorkoutCategory): string {
  return WORKOUT_CATEGORY_LABELS[category];
}

export function formatLocalDateTimeLabel(
  localDate: string,
  startedAtIso: string,
  timeZone: string,
): string {
  const time = new Intl.DateTimeFormat("ko-KR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(startedAtIso));

  return `${localDate} ${time}`;
}

/** Short alert for list rows that did not meet the 10min / 1km rule. */
export function workoutListAlertLabel(qualifiesByRule: boolean): string | null {
  if (qualifiesByRule) {
    return null;
  }
  return "10분·1km 미만이라 목표에 안 잡혀요";
}

export function goalStatusLabel(input: {
  qualifiesByRule: boolean;
  countsForDailyGoal: boolean;
}): string {
  if (input.countsForDailyGoal) {
    return "이번 주 목표에 반영";
  }
  if (input.qualifiesByRule) {
    return "같은 날 다른 기록이 목표에 반영됨";
  }
  return "10분·1km 미만 · 목표 미반영";
}
