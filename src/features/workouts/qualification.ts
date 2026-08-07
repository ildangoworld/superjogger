/** Minimum duration (seconds) to qualify as one goal session. */
export const QUALIFYING_DURATION_SECONDS = 10 * 60;

/** Minimum distance (meters) to qualify as one goal session. */
export const QUALIFYING_DISTANCE_METERS = 1000;

/**
 * Goal recognition is deterministic app code, not AI.
 * Qualifies when duration >= 10 minutes OR distance >= 1km.
 */
export function qualifiesByRule(
  durationSeconds: number,
  distanceMeters: number,
): boolean {
  return (
    durationSeconds >= QUALIFYING_DURATION_SECONDS ||
    distanceMeters >= QUALIFYING_DISTANCE_METERS
  );
}

export type DailyGoalCandidate = {
  id: string;
  localDate: string;
  qualifiesByRule: boolean;
  createdAt: string;
};

/**
 * For each local date, at most one qualifying workout counts toward the weekly goal.
 * The earliest created qualifying workout is the representative.
 */
export function assignCountsForDailyGoal(
  workouts: DailyGoalCandidate[],
): Map<string, boolean> {
  const flags = new Map<string, boolean>();
  const byDate = new Map<string, DailyGoalCandidate[]>();

  for (const workout of workouts) {
    flags.set(workout.id, false);
    const list = byDate.get(workout.localDate) ?? [];
    list.push(workout);
    byDate.set(workout.localDate, list);
  }

  for (const list of byDate.values()) {
    const qualifying = list
      .filter((item) => item.qualifiesByRule)
      .sort((a, b) => {
        const byCreated = a.createdAt.localeCompare(b.createdAt);
        if (byCreated !== 0) {
          return byCreated;
        }
        return a.id.localeCompare(b.id);
      });

    if (qualifying[0]) {
      flags.set(qualifying[0].id, true);
    }
  }

  return flags;
}

export function kilometersToMeters(kilometers: number): number {
  return Math.round(kilometers * 1000);
}

export function metersToKilometers(meters: number): number {
  return meters / 1000;
}

export function durationPartsToSeconds(
  hours: number,
  minutes: number,
  seconds: number,
): number {
  return hours * 3600 + minutes * 60 + seconds;
}

export function secondsToDurationParts(totalSeconds: number): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}
