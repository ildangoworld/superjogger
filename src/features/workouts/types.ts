export type WorkoutCategory = "RUNNING" | "WALKING" | "MIXED";

export const WORKOUT_CATEGORY_LABELS: Record<WorkoutCategory, string> = {
  RUNNING: "달리기",
  WALKING: "걷기",
  MIXED: "걷기·달리기 혼합",
};

export type Workout = {
  id: string;
  userId: string;
  category: WorkoutCategory;
  startedAt: string;
  localDate: string;
  durationSeconds: number;
  distanceMeters: number;
  perceivedExertion: number;
  conditionScore: number;
  hasPain: boolean;
  painArea: string | null;
  painDetails: string | null;
  averageHeartRate: number | null;
  cadence: number | null;
  stepCount: number | null;
  memo: string | null;
  qualifiesByRule: boolean;
  countsForDailyGoal: boolean;
  activeAnalysisId: string | null;
  createdAt: string;
  updatedAt: string;
};
