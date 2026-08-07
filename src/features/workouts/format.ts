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

export function goalStatusLabel(input: {
  qualifiesByRule: boolean;
  countsForDailyGoal: boolean;
}): string {
  if (input.countsForDailyGoal) {
    return "목표 인정";
  }
  if (input.qualifiesByRule) {
    return "인정 조건 충족 · 당일 대표 아님";
  }
  return "목표 미반영";
}
