export type RecommendationDetail = "LIGHT" | "DETAILED";

export type ExperienceLevel =
  | "BEGINNER"
  | "RETURNING"
  | "REGULAR"
  | "ADVANCED";

export type PrimaryGoal = "HABIT" | "HEALTH" | "STRESS_RELIEF" | "ENJOYMENT";

export type Profile = {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  timezone: string;
  recommendationDetail: RecommendationDetail;
  onboardingCompleted: boolean;
};

export type UserPreferences = {
  userId: string;
  experienceLevel: ExperienceLevel | null;
  primaryGoal: PrimaryGoal | null;
  availableWeekdays: number[] | null;
  baselineWeeklyFrequency: number | null;
};
