import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assignCountsForDailyGoal,
  cadenceFromStepCount,
  durationPartsToSeconds,
  kilometersToMeters,
  qualifiesByRule,
  stepCountFromCadence,
} from "./qualification.ts";
import {
  formatLocalDate,
  getWeekStartFromLocalDateString,
} from "../../lib/dates/week.ts";
import {
  isFutureLocalDate,
  zonedLocalToUtcIso,
} from "../../lib/dates/zoned.ts";

describe("qualifiesByRule", () => {
  it("does not qualify 9m59s and 999m", () => {
    assert.equal(qualifiesByRule(599, 999), false);
  });

  it("qualifies 10 minutes with 0m", () => {
    assert.equal(qualifiesByRule(600, 0), true);
  });

  it("qualifies 1km with 5 minutes", () => {
    assert.equal(qualifiesByRule(300, 1000), true);
  });

  it("applies the same rule for every category input pair", () => {
    assert.equal(qualifiesByRule(600, 0), true);
    assert.equal(qualifiesByRule(0, 1000), true);
    assert.equal(qualifiesByRule(599, 999), false);
  });
});

describe("assignCountsForDailyGoal", () => {
  it("counts at most one qualifying workout per local day", () => {
    const flags = assignCountsForDailyGoal([
      {
        id: "a",
        localDate: "2026-08-03",
        qualifiesByRule: true,
        createdAt: "2026-08-03T01:00:00.000Z",
      },
      {
        id: "b",
        localDate: "2026-08-03",
        qualifiesByRule: true,
        createdAt: "2026-08-03T02:00:00.000Z",
      },
      {
        id: "c",
        localDate: "2026-08-03",
        qualifiesByRule: true,
        createdAt: "2026-08-03T03:00:00.000Z",
      },
    ]);

    assert.equal(flags.get("a"), true);
    assert.equal(flags.get("b"), false);
    assert.equal(flags.get("c"), false);
  });

  it("promotes the next qualifying workout when the representative is removed", () => {
    const afterDelete = assignCountsForDailyGoal([
      {
        id: "b",
        localDate: "2026-08-03",
        qualifiesByRule: true,
        createdAt: "2026-08-03T02:00:00.000Z",
      },
      {
        id: "c",
        localDate: "2026-08-03",
        qualifiesByRule: true,
        createdAt: "2026-08-03T03:00:00.000Z",
      },
    ]);

    assert.equal(afterDelete.get("b"), true);
    assert.equal(afterDelete.get("c"), false);
  });

  it("does not count non-qualifying workouts", () => {
    const flags = assignCountsForDailyGoal([
      {
        id: "a",
        localDate: "2026-08-03",
        qualifiesByRule: false,
        createdAt: "2026-08-03T01:00:00.000Z",
      },
      {
        id: "b",
        localDate: "2026-08-03",
        qualifiesByRule: true,
        createdAt: "2026-08-03T02:00:00.000Z",
      },
    ]);

    assert.equal(flags.get("a"), false);
    assert.equal(flags.get("b"), true);
  });
});

describe("distance and duration helpers", () => {
  it("converts 0.999km to 999 meters", () => {
    assert.equal(kilometersToMeters(0.999), 999);
  });

  it("converts 10 minutes from parts", () => {
    assert.equal(durationPartsToSeconds(0, 10, 0), 600);
  });
});

describe("cadence and step count", () => {
  it("derives step count from cadence and duration", () => {
    assert.equal(stepCountFromCadence(180, 600), 1800);
  });

  it("derives cadence from step count and duration", () => {
    assert.equal(cadenceFromStepCount(1800, 600), 180);
  });

  it("returns null when duration is zero", () => {
    assert.equal(stepCountFromCadence(180, 0), null);
    assert.equal(cadenceFromStepCount(1800, 0), null);
  });

  it("rounds to integers", () => {
    assert.equal(stepCountFromCadence(161, 90), 242);
    assert.equal(cadenceFromStepCount(1000, 370), 162);
  });
});

describe("date helpers", () => {
  it("rejects future local dates", () => {
    assert.equal(isFutureLocalDate("2026-08-08", "2026-08-07"), true);
    assert.equal(isFutureLocalDate("2026-08-07", "2026-08-07"), false);
  });

  it("computes Monday week start from a local date", () => {
    assert.equal(getWeekStartFromLocalDateString("2026-08-07"), "2026-08-03");
  });

  it("formats Asia/Seoul local date around UTC midnight boundary", () => {
    const instant = new Date("2026-08-06T15:30:00.000Z");
    assert.equal(formatLocalDate("Asia/Seoul", instant), "2026-08-07");
  });

  it("converts Seoul wall time to the expected UTC instant", () => {
    const iso = zonedLocalToUtcIso("2026-08-07", "09:30", "Asia/Seoul");
    assert.equal(iso, "2026-08-07T00:30:00.000Z");
  });
});
