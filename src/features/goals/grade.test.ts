import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateJoggerGrade, weekSucceeded } from "./grade.ts";
import { listCompletedWeekStarts } from "../../lib/dates/week.ts";

describe("weekSucceeded", () => {
  it("caps success at one even when qualified days exceed the goal", () => {
    assert.equal(
      weekSucceeded({
        weekStart: "2026-07-06",
        goalCount: 3,
        qualifiedDayCount: 4,
      }),
      true,
    );
  });

  it("fails when qualified days are below the goal", () => {
    assert.equal(
      weekSucceeded({
        weekStart: "2026-07-06",
        goalCount: 3,
        qualifiedDayCount: 2,
      }),
      false,
    );
  });
});

describe("listCompletedWeekStarts", () => {
  it("excludes the current in-progress week", () => {
    assert.deepEqual(listCompletedWeekStarts("2026-07-06", "2026-08-03"), [
      "2026-07-06",
      "2026-07-13",
      "2026-07-20",
      "2026-07-27",
    ]);
  });
});

describe("calculateJoggerGrade", () => {
  it("stays pending until two weeks have been completed", () => {
    const completed = listCompletedWeekStarts("2026-07-27", "2026-08-03");
    const result = calculateJoggerGrade({
      completedWeekStarts: completed,
      outcomes: [
        { weekStart: "2026-07-27", goalCount: 3, qualifiedDayCount: 3 },
      ],
    });
    assert.equal(completed.length, 1);
    assert.equal(result.grade, "PENDING");
  });

  it("computes a provisional grade once two weeks are completed", () => {
    const completed = listCompletedWeekStarts("2026-07-20", "2026-08-03");
    const result = calculateJoggerGrade({
      completedWeekStarts: completed,
      outcomes: [
        { weekStart: "2026-07-20", goalCount: 3, qualifiedDayCount: 3 },
        { weekStart: "2026-07-27", goalCount: 3, qualifiedDayCount: 0 },
      ],
    });
    assert.equal(result.completedWeekCountSinceStart, 2);
    assert.equal(result.isProvisional, true);
    assert.equal(result.evaluatedWeekCount, 2);
    assert.equal(result.successfulWeekCount, 1);
    assert.equal(result.achievementRate, 50);
    assert.equal(result.grade, "RARE");
  });

  it("computes a provisional grade from week 3 onward with more history", () => {
    const completed = listCompletedWeekStarts("2026-07-13", "2026-08-03");
    const result = calculateJoggerGrade({
      completedWeekStarts: completed,
      outcomes: [
        { weekStart: "2026-07-13", goalCount: 3, qualifiedDayCount: 3 },
        { weekStart: "2026-07-20", goalCount: 3, qualifiedDayCount: 0 },
        { weekStart: "2026-07-27", goalCount: 3, qualifiedDayCount: 3 },
      ],
    });
    assert.equal(result.completedWeekCountSinceStart, 3);
    assert.equal(result.isProvisional, true);
    assert.equal(result.evaluatedWeekCount, 3);
    assert.equal(result.successfulWeekCount, 2);
    assert.equal(result.achievementRate, 67);
    assert.equal(result.grade, "EPIC");
  });

  it("ignores the current week even if an outcome is provided", () => {
    const completed = listCompletedWeekStarts("2026-06-08", "2026-08-03");
    const result = calculateJoggerGrade({
      completedWeekStarts: completed,
      outcomes: [
        { weekStart: "2026-06-08", goalCount: 2, qualifiedDayCount: 2 },
        { weekStart: "2026-06-15", goalCount: 2, qualifiedDayCount: 2 },
        { weekStart: "2026-06-22", goalCount: 2, qualifiedDayCount: 2 },
        { weekStart: "2026-06-29", goalCount: 2, qualifiedDayCount: 2 },
        { weekStart: "2026-07-06", goalCount: 2, qualifiedDayCount: 2 },
        { weekStart: "2026-07-13", goalCount: 2, qualifiedDayCount: 2 },
        { weekStart: "2026-07-20", goalCount: 2, qualifiedDayCount: 2 },
        { weekStart: "2026-07-27", goalCount: 2, qualifiedDayCount: 2 },
        { weekStart: "2026-08-03", goalCount: 2, qualifiedDayCount: 0 },
      ],
    });
    assert.equal(result.completedWeekCountSinceStart, 8);
    assert.equal(result.isProvisional, false);
    assert.equal(result.evaluatedWeekCount, 8);
    assert.equal(result.achievementRate, 100);
    assert.equal(result.grade, "LEGENDARY");
  });
});
