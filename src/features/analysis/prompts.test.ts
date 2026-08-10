import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSystemPrompt,
  DEFAULT_AI_PROMPTS,
  DETAIL_RULE_PLACEHOLDER,
  normalizeAiPromptSettings,
} from "./prompts.ts";

describe("buildSystemPrompt", () => {
  it("substitutes the detail rule placeholder", () => {
    const detailed = buildSystemPrompt(DEFAULT_AI_PROMPTS, "DETAILED");
    const light = buildSystemPrompt(DEFAULT_AI_PROMPTS, "LIGHT");

    assert.equal(detailed.includes(DETAIL_RULE_PLACEHOLDER), false);
    assert.equal(light.includes(DETAIL_RULE_PLACEHOLDER), false);
    assert.equal(
      detailed.includes(DEFAULT_AI_PROMPTS.detailRuleDetailed),
      true,
    );
    assert.equal(light.includes(DEFAULT_AI_PROMPTS.detailRuleLight), true);
    assert.equal(
      detailed.includes(DEFAULT_AI_PROMPTS.detailRuleLight),
      false,
    );
  });

  it("appends the detail rule when the placeholder is missing", () => {
    const prompts = {
      ...DEFAULT_AI_PROMPTS,
      systemPrompt: "시스템만 있습니다.",
    };
    const result = buildSystemPrompt(prompts, "LIGHT");
    assert.equal(
      result,
      `시스템만 있습니다. ${DEFAULT_AI_PROMPTS.detailRuleLight}`,
    );
  });
});

describe("normalizeAiPromptSettings", () => {
  it("falls back to code defaults when values are empty", () => {
    assert.deepEqual(normalizeAiPromptSettings({}), DEFAULT_AI_PROMPTS);
    assert.deepEqual(
      normalizeAiPromptSettings({
        systemPrompt: "   ",
        detailRuleDetailed: "",
        detailRuleLight: null,
        userInstruction: undefined,
      }),
      DEFAULT_AI_PROMPTS,
    );
  });

  it("keeps non-empty stored prompt values", () => {
    const settings = normalizeAiPromptSettings({
      systemPrompt: "custom system {{detail_rule}}",
      detailRuleDetailed: "detailed rule",
      detailRuleLight: "light rule",
      userInstruction: "user instruction",
    });
    assert.deepEqual(settings, {
      systemPrompt: "custom system {{detail_rule}}",
      detailRuleDetailed: "detailed rule",
      detailRuleLight: "light rule",
      userInstruction: "user instruction",
    });
  });
});
