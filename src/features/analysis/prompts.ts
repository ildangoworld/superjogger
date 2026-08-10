export const DETAIL_RULE_PLACEHOLDER = "{{detail_rule}}";

export type AiPromptConfig = {
  systemPrompt: string;
  detailRuleDetailed: string;
  detailRuleLight: string;
  userInstruction: string;
};

export const DEFAULT_AI_PROMPTS: AiPromptConfig = {
  systemPrompt: [
    "당신은 SuperJogger의 AI 조깅 코치입니다.",
    "달리기·걷기·혼합 운동을 동등하게 존중하세요.",
    "의료 진단·처방·확정적 회복 판정을 하지 마세요.",
    "통증·급격한 증가·위험 신호가 있으면 칭찬보다 안전 안내를 우선하세요.",
    "알 수 없는 의도를 추측해 단정하지 마세요.",
    "사실(기록)과 해석·제안을 구분하는 톤으로 한국어로 답하세요.",
    "전문 용어(RPE, 자각 강도 등) 대신 '스스로 느낀 강도', '운동이 얼마나 힘들었는지'처럼 쉬운 말로 쓰세요. 꼭 필요한 용어는 바로 이어서 짧게 풀어 쓰세요.",
    "perceived_exertion은 '스스로 느낀 강도'로 부르세요.",
    "average_heart_rate(평균 심박수)나 cadence(케이던스)가 있으면 intensityInterpretation과 nextWorkoutSuggestion에 반드시 반영하고, 결과 문장에서 그 수치를 읽어 주세요. 값이 없으면 억지로 추측하지 마세요.",
    DETAIL_RULE_PLACEHOLDER,
    "반드시 지정된 JSON 객체만 반환하세요. 추가 키나 마크다운을 넣지 마세요.",
    "필드: summary, intensityInterpretation, trend, nextWorkoutSuggestion, safetyNotice(없으면 null), trendSummaryForNextAnalysis, riskLevel(NONE|CAUTION|HIGH).",
  ].join(" "),
  detailRuleDetailed:
    "nextWorkoutSuggestion에는 권장 시간·강도·주의사항을 구체적으로 적으세요.",
  detailRuleLight:
    "nextWorkoutSuggestion에는 다음 운동의 방향만 짧게 제안하세요.",
  userInstruction:
    "아래 구조화 컨텍스트만으로 이번 운동을 분석하세요. 원본 집계 수치를 AI 이전 요약보다 우선하세요.",
};

function promptSettingString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value == null) {
    return "";
  }
  return String(value).trim();
}

export function normalizeAiPromptSettings(input: {
  systemPrompt?: unknown;
  detailRuleDetailed?: unknown;
  detailRuleLight?: unknown;
  userInstruction?: unknown;
}): AiPromptConfig {
  return {
    systemPrompt:
      promptSettingString(input.systemPrompt) || DEFAULT_AI_PROMPTS.systemPrompt,
    detailRuleDetailed:
      promptSettingString(input.detailRuleDetailed) ||
      DEFAULT_AI_PROMPTS.detailRuleDetailed,
    detailRuleLight:
      promptSettingString(input.detailRuleLight) ||
      DEFAULT_AI_PROMPTS.detailRuleLight,
    userInstruction:
      promptSettingString(input.userInstruction) ||
      DEFAULT_AI_PROMPTS.userInstruction,
  };
}

export function buildSystemPrompt(
  prompts: AiPromptConfig,
  detail: "LIGHT" | "DETAILED",
): string {
  const detailRule =
    detail === "DETAILED"
      ? prompts.detailRuleDetailed
      : prompts.detailRuleLight;

  if (prompts.systemPrompt.includes(DETAIL_RULE_PLACEHOLDER)) {
    return prompts.systemPrompt.split(DETAIL_RULE_PLACEHOLDER).join(detailRule);
  }

  return `${prompts.systemPrompt} ${detailRule}`.trim();
}
