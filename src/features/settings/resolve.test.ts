import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeAiAppSettings,
  parseDailyLimit,
  resolveAiRuntimeConfig,
} from "./resolve.ts";

describe("parseDailyLimit", () => {
  it("accepts integers between 1 and 50", () => {
    assert.equal(parseDailyLimit(5), 5);
    assert.equal(parseDailyLimit("10"), 10);
  });

  it("falls back to the default for invalid values", () => {
    assert.equal(parseDailyLimit(0), 3);
    assert.equal(parseDailyLimit(51), 3);
    assert.equal(parseDailyLimit("x"), 3);
  });
});

describe("resolveAiRuntimeConfig", () => {
  it("prefers non-empty app_settings over env", () => {
    const resolved = resolveAiRuntimeConfig({
      settings: normalizeAiAppSettings({
        aiModel: "settings-model",
        aiDailyLimit: 5,
        aiBaseUrl: "https://settings.example/v1",
      }),
      env: {
        apiKey: "secret",
        model: "env-model",
        baseUrl: "https://env.example/v1",
      },
    });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) {
      assert.fail(resolved.error);
    }
    assert.equal(resolved.config.model, "settings-model");
    assert.equal(resolved.config.baseUrl, "https://settings.example/v1");
    assert.equal(resolved.config.dailyLimit, 5);
    assert.equal(resolved.config.apiKey, "secret");
  });

  it("falls back to env when settings strings are empty", () => {
    const resolved = resolveAiRuntimeConfig({
      settings: normalizeAiAppSettings({
        aiModel: "",
        aiDailyLimit: 3,
        aiBaseUrl: "",
      }),
      env: {
        apiKey: "secret",
        model: "env-model",
        baseUrl: "https://env.example/v1/",
      },
    });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) {
      assert.fail(resolved.error);
    }
    assert.equal(resolved.config.model, "env-model");
    assert.equal(resolved.config.baseUrl, "https://env.example/v1");
  });

  it("requires API key from env", () => {
    const resolved = resolveAiRuntimeConfig({
      settings: normalizeAiAppSettings({
        aiModel: "m",
        aiDailyLimit: 3,
        aiBaseUrl: "",
      }),
      env: { apiKey: "", model: "m", baseUrl: "" },
    });
    assert.deepEqual(resolved, {
      ok: false,
      error: "AI_API_KEY is not set",
    });
  });
});
