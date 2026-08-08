import type {
  AiAppSettings,
  AiRuntimeConfig,
} from "./types";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_DAILY_LIMIT = 3;

export function parseSettingString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value == null) {
    return "";
  }
  return String(value).trim();
}

export function parseDailyLimit(value: unknown): number {
  const raw =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isInteger(raw) || raw < 1 || raw > 50) {
    return DEFAULT_DAILY_LIMIT;
  }
  return raw;
}

export function normalizeAiAppSettings(input: {
  aiModel?: unknown;
  aiDailyLimit?: unknown;
  aiBaseUrl?: unknown;
}): AiAppSettings {
  return {
    aiModel: parseSettingString(input.aiModel),
    aiDailyLimit: parseDailyLimit(input.aiDailyLimit),
    aiBaseUrl: parseSettingString(input.aiBaseUrl),
  };
}

/**
 * app_settings values win when non-empty; otherwise fall back to env.
 * API key always comes from the environment.
 */
export function resolveAiRuntimeConfig(input: {
  settings: AiAppSettings;
  env: {
    apiKey?: string | null;
    model?: string | null;
    baseUrl?: string | null;
  };
}): { ok: true; config: AiRuntimeConfig } | { ok: false; error: string } {
  const apiKey = input.env.apiKey?.trim() ?? "";
  if (!apiKey) {
    return { ok: false, error: "AI_API_KEY is not set" };
  }

  const model =
    input.settings.aiModel || input.env.model?.trim() || "";
  if (!model) {
    return { ok: false, error: "AI_MODEL is not set" };
  }

  const baseUrl = (
    input.settings.aiBaseUrl ||
    input.env.baseUrl?.trim() ||
    DEFAULT_BASE_URL
  ).replace(/\/$/, "");

  return {
    ok: true,
    config: {
      apiKey,
      model,
      baseUrl,
      dailyLimit: input.settings.aiDailyLimit,
    },
  };
}
