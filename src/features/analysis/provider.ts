import {
  parseWorkoutAnalysisResult,
  SCHEMA_RETRY_LIMIT,
} from "@/features/analysis/schema";
import type { AnalysisContext } from "@/features/analysis/context";
import type { WorkoutAnalysisResult } from "@/features/analysis/types";

function getAiConfig() {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  const baseUrl = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );

  if (!apiKey) {
    throw new Error("AI_API_KEY is not set");
  }
  if (!model) {
    throw new Error("AI_MODEL is not set");
  }

  return { apiKey, model, baseUrl };
}

function buildSystemPrompt(detail: "LIGHT" | "DETAILED"): string {
  const detailRule =
    detail === "DETAILED"
      ? "nextWorkoutSuggestion에는 권장 시간·강도·주의사항을 구체적으로 적으세요."
      : "nextWorkoutSuggestion에는 다음 운동의 방향만 짧게 제안하세요.";

  return [
    "당신은 SuperJogger의 AI 조깅 코치입니다.",
    "달리기·걷기·혼합 운동을 동등하게 존중하세요.",
    "의료 진단·처방·확정적 회복 판정을 하지 마세요.",
    "통증·급격한 증가·위험 신호가 있으면 칭찬보다 안전 안내를 우선하세요.",
    "알 수 없는 의도를 추측해 단정하지 마세요.",
    "사실(기록)과 해석·제안을 구분하는 톤으로 한국어로 답하세요.",
    detailRule,
    "반드시 지정된 JSON 객체만 반환하세요. 추가 키나 마크다운을 넣지 마세요.",
    "필드: summary, intensityInterpretation, trend, nextWorkoutSuggestion, safetyNotice(없으면 null), trendSummaryForNextAnalysis, riskLevel(NONE|CAUTION|HIGH).",
  ].join(" ");
}

async function requestOnce(
  context: AnalysisContext,
): Promise<{ model: string; raw: unknown }> {
  const { apiKey, model, baseUrl } = getAiConfig();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(context.recommendationDetail),
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction:
              "아래 구조화 컨텍스트만으로 이번 운동을 분석하세요. 원본 집계 수치를 AI 이전 요약보다 우선하세요.",
            context,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI request failed (${response.status}): ${body.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI response content is empty");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new Error("AI response is not valid JSON");
  }

  return { model, raw };
}

export type ProviderCallResult =
  | {
      ok: true;
      result: WorkoutAnalysisResult;
      modelName: string;
      requestSent: true;
    }
  | {
      ok: false;
      error: string;
      modelName: string | null;
      requestSent: boolean;
    };

export async function callWorkoutAnalysisProvider(
  context: AnalysisContext,
): Promise<ProviderCallResult> {
  try {
    getAiConfig();
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "AI 설정이 올바르지 않아요.",
      modelName: null,
      requestSent: false,
    };
  }

  let modelName: string | null = null;
  let requestSent = false;
  let lastError = "AI 분석을 완료하지 못했어요.";

  for (let attempt = 0; attempt <= SCHEMA_RETRY_LIMIT; attempt += 1) {
    try {
      const { model, raw } = await requestOnce(context);
      modelName = model;
      requestSent = true;
      const parsed = parseWorkoutAnalysisResult(raw);
      if (parsed.ok) {
        return { ok: true, result: parsed.data, modelName: model, requestSent: true };
      }
      lastError = parsed.error;
    } catch (error) {
      requestSent = true;
      lastError =
        error instanceof Error ? error.message : "AI 분석을 완료하지 못했어요.";
    }
  }

  return { ok: false, error: lastError, modelName, requestSent };
}
