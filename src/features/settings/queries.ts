import type { Json } from "@/lib/database.types";
import {
  normalizeAiAppSettings,
  resolveAiRuntimeConfig,
} from "@/features/settings/resolve";
import type {
  AiAppSettings,
  AiRuntimeConfig,
  AppSettingRow,
} from "@/features/settings/types";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

type DbClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createServiceRoleClient>;

function rowsToSettings(rows: AppSettingRow[]): AiAppSettings {
  const map = new Map(rows.map((row) => [row.key, row.value]));
  return normalizeAiAppSettings({
    aiModel: map.get("ai_model"),
    aiDailyLimit: map.get("ai_daily_limit"),
    aiBaseUrl: map.get("ai_base_url"),
  });
}

export async function loadAiAppSettings(
  client?: DbClient,
): Promise<AiAppSettings> {
  const db = client ?? (await createClient());
  const { data, error } = await db
    .from("app_settings")
    .select("key, value, updated_by, updated_at")
    .in("key", ["ai_model", "ai_daily_limit", "ai_base_url"]);

  if (error) {
    throw new Error(error.message);
  }

  return rowsToSettings((data ?? []) as AppSettingRow[]);
}

export async function getAiDailyLimit(client?: DbClient): Promise<number> {
  const settings = await loadAiAppSettings(client);
  return settings.aiDailyLimit;
}

export async function getAiRuntimeConfig(): Promise<
  { ok: true; config: AiRuntimeConfig } | { ok: false; error: string }
> {
  let settings: AiAppSettings;
  try {
    settings = await loadAiAppSettings(createServiceRoleClient());
  } catch {
    settings = normalizeAiAppSettings({});
  }

  return resolveAiRuntimeConfig({
    settings,
    env: {
      apiKey: process.env.AI_API_KEY,
      model: process.env.AI_MODEL,
      baseUrl: process.env.AI_BASE_URL,
    },
  });
}

export async function saveAiAppSettings(input: {
  settings: AiAppSettings;
  updatedBy: string;
}): Promise<void> {
  const db = createServiceRoleClient();
  const rows: Array<{
    key: "ai_model" | "ai_daily_limit" | "ai_base_url";
    value: Json;
    updated_by: string;
  }> = [
    {
      key: "ai_model",
      value: input.settings.aiModel as unknown as Json,
      updated_by: input.updatedBy,
    },
    {
      key: "ai_daily_limit",
      value: input.settings.aiDailyLimit as unknown as Json,
      updated_by: input.updatedBy,
    },
    {
      key: "ai_base_url",
      value: input.settings.aiBaseUrl as unknown as Json,
      updated_by: input.updatedBy,
    },
  ];

  const { error } = await db.from("app_settings").upsert(rows, {
    onConflict: "key",
  });

  if (error) {
    throw new Error(error.message);
  }
}
