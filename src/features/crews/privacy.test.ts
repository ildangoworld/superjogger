import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CrewBoardMember } from "./types.ts";

const PUBLIC_BOARD_KEYS = [
  "userId",
  "nickname",
  "avatarUrl",
  "role",
  "targetCount",
  "qualifiedDayCount",
  "achievementPercent",
  "status",
  "gradeLabel",
  "isSelf",
] as const;

const FORBIDDEN_PUBLIC_KEYS = [
  "pain",
  "hasPain",
  "painArea",
  "painDetails",
  "condition",
  "conditionScore",
  "heartRate",
  "averageHeartRate",
  "memo",
  "analysis",
  "summary",
  "safetyNotice",
] as const;

describe("crew board privacy surface", () => {
  it("exposes only the public progress fields on CrewBoardMember", () => {
    const sample: CrewBoardMember = {
      userId: "u1",
      nickname: "조거",
      avatarUrl: null,
      role: "MEMBER",
      targetCount: 3,
      qualifiedDayCount: 1,
      achievementPercent: 33,
      status: "IN_PROGRESS",
      gradeLabel: "산정 중",
      isSelf: false,
    };

    assert.deepEqual(
      Object.keys(sample).sort(),
      [...PUBLIC_BOARD_KEYS].sort(),
    );

    for (const key of FORBIDDEN_PUBLIC_KEYS) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(sample, key),
        false,
        `public board must not include ${key}`,
      );
    }
  });
});
