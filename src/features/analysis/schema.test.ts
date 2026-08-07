import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countUsedAnalysisSlots,
  parseWorkoutAnalysisResult,
  remainingAnalysisSlots,
} from "./schema.ts";
import { hasCoreAnalysisFieldsChanged } from "./stale.ts";
import { analysisStatusLabel } from "./format.ts";

describe("analysis schema", () => {
  it("parses a valid WorkoutAnalysisResult", () => {
    const parsed = parseWorkoutAnalysisResult({
      summary: "오늘은 가볍게 잘 움직였어요.",
      intensityInterpretation: "대화가 가능한 강도였어요.",
      trend: "최근과 비슷한 흐름이에요.",
      nextWorkoutSuggestion: "다음엔 가볍게 이어가세요.",
      safetyNotice: null,
      trendSummaryForNextAnalysis: "최근 3회는 안정적인 페이스.",
      riskLevel: "NONE",
    });
    assert.equal(parsed.ok, true);
  });

  it("rejects invalid riskLevel", () => {
    const parsed = parseWorkoutAnalysisResult({
      summary: "요약",
      intensityInterpretation: "강도",
      trend: "추세",
      nextWorkoutSuggestion: "제안",
      safetyNotice: null,
      trendSummaryForNextAnalysis: "다음용",
      riskLevel: "MEDIUM",
    });
    assert.equal(parsed.ok, false);
  });
});

describe("analysis usage counting", () => {
  it("counts RESERVED and CONSUMED toward the daily limit", () => {
    assert.equal(
      countUsedAnalysisSlots(["RESERVED", "CONSUMED", "RELEASED", "CONSUMED"]),
      3,
    );
    assert.equal(remainingAnalysisSlots(3), 0);
    assert.equal(remainingAnalysisSlots(1), 2);
  });
});

describe("core field stale detection", () => {
  const base = {
    category: "RUNNING",
    localDate: "2026-08-07",
    durationSeconds: 600,
    distanceMeters: 1000,
    perceivedExertion: 3,
    conditionScore: 4,
    hasPain: false,
    painArea: null,
    painDetails: null,
    averageHeartRate: 140,
  };

  it("detects core field changes", () => {
    assert.equal(
      hasCoreAnalysisFieldsChanged(base, { ...base, distanceMeters: 1200 }),
      true,
    );
  });

  it("ignores identical core values", () => {
    assert.equal(hasCoreAnalysisFieldsChanged(base, { ...base }), false);
  });
});

describe("analysis status labels", () => {
  it("labels limit exceeded without analysis", () => {
    assert.equal(
      analysisStatusLabel(null, { limitExceeded: true }),
      "한도 초과로 미분석",
    );
    assert.equal(analysisStatusLabel("STALE"), "오래됨");
  });
});
