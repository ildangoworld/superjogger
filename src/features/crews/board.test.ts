import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  achievementPercent,
  compareCrewBoardMembers,
  resolveCrewProgressStatus,
} from "./board.ts";

describe("resolveCrewProgressStatus", () => {
  it("marks achieved when qualified days meet the target", () => {
    assert.equal(
      resolveCrewProgressStatus({ targetCount: 3, qualifiedDayCount: 3 }),
      "ACHIEVED",
    );
    assert.equal(
      resolveCrewProgressStatus({ targetCount: 3, qualifiedDayCount: 4 }),
      "ACHIEVED",
    );
  });

  it("marks in progress when at least one qualified day remains below target", () => {
    assert.equal(
      resolveCrewProgressStatus({ targetCount: 3, qualifiedDayCount: 1 }),
      "IN_PROGRESS",
    );
  });

  it("marks not started when there are zero qualified days", () => {
    assert.equal(
      resolveCrewProgressStatus({ targetCount: 3, qualifiedDayCount: 0 }),
      "NOT_STARTED",
    );
  });
});

describe("compareCrewBoardMembers", () => {
  it("orders by status then nickname without ranking numbers", () => {
    const sorted = [
      { status: "NOT_STARTED" as const, nickname: "가나다" },
      { status: "ACHIEVED" as const, nickname: "하늘" },
      { status: "ACHIEVED" as const, nickname: "나무" },
      { status: "IN_PROGRESS" as const, nickname: "바다" },
    ].sort(compareCrewBoardMembers);

    assert.deepEqual(
      sorted.map((row) => `${row.status}:${row.nickname}`),
      [
        "ACHIEVED:나무",
        "ACHIEVED:하늘",
        "IN_PROGRESS:바다",
        "NOT_STARTED:가나다",
      ],
    );
  });
});

describe("achievementPercent", () => {
  it("caps at 100 and returns null without a target", () => {
    assert.equal(
      achievementPercent({ targetCount: 2, qualifiedDayCount: 3 }),
      100,
    );
    assert.equal(
      achievementPercent({ targetCount: null, qualifiedDayCount: 1 }),
      null,
    );
  });
});
