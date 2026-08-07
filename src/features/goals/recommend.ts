export type ExperienceLevel =
  | "BEGINNER"
  | "RETURNING"
  | "REGULAR"
  | "ADVANCED";

export type PrimaryGoal = "HABIT" | "HEALTH" | "STRESS_RELIEF" | "ENJOYMENT";

export type GoalRecommendationInput = {
  baselineWeeklyFrequency: number;
  experienceLevel: ExperienceLevel;
  availableWeekdays: number[];
  conditionScore: number;
  hasPain: boolean;
};

export type GoalRecommendation = {
  recommendedCount: number;
  reason: string;
};

function clampTarget(value: number): number {
  return Math.min(7, Math.max(1, Math.round(value)));
}

/**
 * Deterministic weekly target recommendation for onboarding.
 * Not medical advice — only a starting suggestion the user confirms.
 */
export function recommendWeeklyTarget(
  input: GoalRecommendationInput,
): GoalRecommendation {
  let target = clampTarget(input.baselineWeeklyFrequency || 2);
  const reasons: string[] = [];

  reasons.push(
    `최근 한 달 평균 ${input.baselineWeeklyFrequency}회를 기준으로 잡았어요.`,
  );

  if (input.experienceLevel === "BEGINNER") {
    target = Math.min(target, 3);
    reasons.push("초보 페이스에 맞춰 무리하지 않는 횟수로 조정했어요.");
  } else if (input.experienceLevel === "RETURNING") {
    target = Math.min(target, 4);
    reasons.push("다시 시작하는 리듬에 맞춰 조금 여유 있게 잡았어요.");
  }

  if (input.hasPain) {
    target = Math.max(1, target - 1);
    reasons.push("통증이 있어 목표를 한 단계 낮췄어요. 몸이 우선이에요.");
  } else if (input.conditionScore <= 2) {
    target = Math.max(1, target - 1);
    reasons.push("현재 컨디션이 낮아 목표를 조금 낮췄어요.");
  }

  const available = input.availableWeekdays.length;
  if (target > available) {
    target = Math.max(1, available);
    reasons.push(
      `현실적으로 운동 가능한 요일이 ${available}일이라 그에 맞춰 조정했어요.`,
    );
  }

  return {
    recommendedCount: clampTarget(target),
    reason: reasons.join(" "),
  };
}
