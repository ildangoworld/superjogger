export const APP_SETTING_KEYS = [
  "ai_model",
  "ai_daily_limit",
  "ai_base_url",
] as const;

export type AppSettingKey = (typeof APP_SETTING_KEYS)[number];

export type AiAppSettings = {
  aiModel: string;
  aiDailyLimit: number;
  aiBaseUrl: string;
};

export type AiRuntimeConfig = {
  apiKey: string;
  model: string;
  baseUrl: string;
  dailyLimit: number;
};

export type AppSettingRow = {
  key: string;
  value: unknown;
  updated_by: string | null;
  updated_at: string;
};
