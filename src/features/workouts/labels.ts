export const PERCEIVED_EXERTION_LABELS = {
  1: "아주 쉬움",
  2: "쉬움",
  3: "보통",
  4: "힘듦",
  5: "아주 힘듦",
} as const;

export const CONDITION_SCORE_LABELS = {
  1: "아주 나쁨",
  2: "나쁨",
  3: "보통",
  4: "좋음",
  5: "매우 좋음",
} as const;

export type PerceivedExertionScore = keyof typeof PERCEIVED_EXERTION_LABELS;
export type ConditionScore = keyof typeof CONDITION_SCORE_LABELS;

export const PERCEIVED_EXERTION_OPTIONS = (
  [1, 2, 3, 4, 5] as const
).map((value) => ({
  value,
  label: PERCEIVED_EXERTION_LABELS[value],
}));

/** UI order: best → worst (matches workout form). */
export const CONDITION_OPTIONS = ([5, 4, 3, 2, 1] as const).map((value) => ({
  value,
  label: CONDITION_SCORE_LABELS[value],
}));

function clampScore(value: number): PerceivedExertionScore {
  const rounded = Math.round(value);
  if (rounded <= 1) return 1;
  if (rounded >= 5) return 5;
  return rounded as PerceivedExertionScore;
}

export function formatPerceivedExertion(score: number): string {
  return PERCEIVED_EXERTION_LABELS[clampScore(score)];
}

export function formatConditionScore(score: number): string {
  return CONDITION_SCORE_LABELS[clampScore(score)];
}
