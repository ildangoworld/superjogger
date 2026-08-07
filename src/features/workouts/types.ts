export type WorkoutCategory = "RUNNING" | "WALKING" | "MIXED";

export const WORKOUT_CATEGORY_LABELS: Record<WorkoutCategory, string> = {
  RUNNING: "달리기",
  WALKING: "걷기",
  MIXED: "걷기·달리기 혼합",
};
