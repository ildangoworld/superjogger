import type { WorkoutCategory } from "@/features/workouts/types";
import { metersToKilometers } from "@/features/workouts/qualification";

export type WorkoutFormValues = {
  category: WorkoutCategory;
  localDate: string;
  localTime: string;
  distanceKm: number;
  durationSeconds: number;
  perceivedExertion: number;
  conditionScore: number;
  hasPain: boolean;
  painArea: string | null;
  painDetails: string | null;
  averageHeartRate: number | null;
  cadence: number | null;
  stepCount: number | null;
  memo: string | null;
};

export function buildDefaultCreateValues(localDate: string): WorkoutFormValues {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return {
    category: "RUNNING",
    localDate,
    localTime: `${hours}:${minutes}`,
    distanceKm: 0,
    durationSeconds: 0,
    perceivedExertion: 3,
    conditionScore: 3,
    hasPain: false,
    painArea: null,
    painDetails: null,
    averageHeartRate: null,
    cadence: null,
    stepCount: null,
    memo: null,
  };
}

export function buildEditValues(input: {
  category: WorkoutCategory;
  localDate: string;
  localTime: string;
  distanceMeters: number;
  durationSeconds: number;
  perceivedExertion: number;
  conditionScore: number;
  hasPain: boolean;
  painArea: string | null;
  painDetails: string | null;
  averageHeartRate: number | null;
  cadence: number | null;
  stepCount: number | null;
  memo: string | null;
}): WorkoutFormValues {
  return {
    category: input.category,
    localDate: input.localDate,
    localTime: input.localTime,
    distanceKm: metersToKilometers(input.distanceMeters),
    durationSeconds: input.durationSeconds,
    perceivedExertion: input.perceivedExertion,
    conditionScore: input.conditionScore,
    hasPain: input.hasPain,
    painArea: input.painArea,
    painDetails: input.painDetails,
    averageHeartRate: input.averageHeartRate,
    cadence: input.cadence,
    stepCount: input.stepCount,
    memo: input.memo,
  };
}
