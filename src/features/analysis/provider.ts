import {
  buildSystemPrompt,
  type AiPromptConfig,
} from "@/features/analysis/prompts";
import {
  parseWorkoutAnalysisResult,
  SCHEMA_RETRY_LIMIT,
} from "@/features/analysis/schema";
import type { AnalysisContext } from "@/features/analysis/context";
import type { WorkoutAnalysisResult } from "@/features/analysis/types";
import {
  getAiPromptConfig,
  getAiRuntimeConfig,
} from "@/features/settings/queries";

async function requestOnce(
  context: AnalysisContext,
  prompts: AiPromptConfig,
): Promise<{ model: string; raw: unknown }> {
  const resolved = await getAiRuntimeConfig();
  if (!resolved.ok) {
    throw new Error(resolved.error);
  }

  const { apiKey, model, baseUrl } = resolved.config;

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
          content: buildSystemPrompt(prompts, context.recommendationDetail),
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction: prompts.userInstruction,
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
  const resolved = await getAiRuntimeConfig();
  if (!resolved.ok) {
    return {
      ok: false,
      error: resolved.error,
      modelName: null,
      requestSent: false,
    };
  }

  const prompts = await getAiPromptConfig();
  let modelName: string | null = null;
  let requestSent = false;
  let lastError = "AI 분석을 완료하지 못했어요.";

  for (let attempt = 0; attempt <= SCHEMA_RETRY_LIMIT; attempt += 1) {
    try {
      const { model, raw } = await requestOnce(context, prompts);
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
