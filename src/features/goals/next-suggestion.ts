import type { RecommendationDetail } from "@/features/auth/types";
import type { WorkoutCategory } from "@/features/workouts/types";
import {
  recommendWeeklyTarget,
  type ExperienceLevel,
  type PrimaryGoal,
} from "@/features/goals/recommend";

export type NextDirectionInput = {
  recommendationDetail: RecommendationDetail;
  lastWorkout: {
    category: WorkoutCategory;
    hasPain: boolean;
    perceivedExertion: number;
    conditionScore: number;
  } | null;
};

export type NextDirectionSuggestion = {
  headline: string;
  body: string;
};

/**
 * Rule-based next-direction copy for Phase 3 home.
 * AI analysis suggestions replace/augment this in Phase 4.
 */
export function suggestNextDirection(
  input: NextDirectionInput,
): NextDirectionSuggestion {
  if (!input.lastWorkout) {
    return {
      headline: "가볍게 시작해요",
      body:
        input.recommendationDetail === "DETAILED"
          ? "오늘은 10~20분, 대화가 가능한 편안한 강도로 걷기나 가벼운 달리기를 해보세요."
          : "달리지 않아도 괜찮아요. 오늘 몸에 맞게 10분부터 움직여보세요.",
    };
  }

  if (input.lastWorkout.hasPain) {
    return {
      headline: "몸이 보내는 신호를 우선해요",
      body:
        input.recommendationDetail === "DETAILED"
          ? "통증이 남아 있다면 운동을 쉬거나 아주 짧게 걸어보세요. 증상이 계속되면 전문가와 상담하세요."
          : "통증이 있으면 운동보다 휴식을 우선하세요. 무리하지 않아도 괜찮아요.",
    };
  }

  if (
    input.lastWorkout.perceivedExertion >= 4 ||
    input.lastWorkout.conditionScore <= 2
  ) {
    return {
      headline: "다음엔 한결 가볍게",
      body:
        input.recommendationDetail === "DETAILED"
          ? "다음 운동은 20분 전후, 편안한 강도로 걸어보거나 섞어 달려보세요."
          : "최근 강도가 높았어요. 다음엔 쉬거나 가볍게 움직이는 쪽을 추천해요.",
    };
  }

  return {
    headline: "지금의 리듬을 이어가요",
    body:
      input.recommendationDetail === "DETAILED"
        ? "다음에도 비슷한 시간으로, 숨이 차지 않는 편안한 강도를 유지해보세요."
        : "지금의 페이스를 유지해도 좋아요. 몸이 괜찮으면 짧게 이어서 움직여보세요.",
  };
}

export function recommendNextWeekTarget(input: {
  baselineWeeklyFrequency: number | null;
  experienceLevel: ExperienceLevel | null;
  primaryGoal: PrimaryGoal | null;
  availableWeekdays: number[] | null;
  recentAverageCondition: number | null;
  recentPainCount: number;
  currentTargetCount: number | null;
}): ReturnType<typeof recommendWeeklyTarget> {
  const baseline =
    input.baselineWeeklyFrequency ?? input.currentTargetCount ?? 2;
  const weekdays =
    input.availableWeekdays && input.availableWeekdays.length > 0
      ? input.availableWeekdays
      : [1, 2, 3, 4, 5, 6, 7];

  const recommendation = recommendWeeklyTarget({
    baselineWeeklyFrequency: baseline,
    experienceLevel: input.experienceLevel ?? "REGULAR",
    availableWeekdays: weekdays,
    conditionScore: input.recentAverageCondition
      ? Math.round(input.recentAverageCondition)
      : 3,
    hasPain: input.recentPainCount > 0,
  });

  if (input.primaryGoal === "HABIT" && recommendation.recommendedCount < 2) {
    return {
      recommendedCount: 2,
      reason: `${recommendation.reason} 습관을 위해 주 2회부터 이어가 보는 것도 좋아요해요.`,
    };
  }

  return recommendation;
}
