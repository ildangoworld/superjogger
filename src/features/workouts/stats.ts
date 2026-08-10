import { weekSucceeded } from "../goals/grade.ts";
import { addDaysToLocalDate } from "../../lib/dates/week.ts";

export type WeekGoalOutcome = {
  weekStart: string;
  goalCount: number;
  qualifiedDayCount: number;
};

/**
 * Counts consecutive weeks where the weekly goal was met.
 * If the current week is not yet successful, counting starts from
 * the previous week so an in-progress week does not break the streak.
 */
export function calculateWeekGoalStreak(input: {
  currentWeekStart: string;
  outcomes: WeekGoalOutcome[];
}): number {
  const byStart = new Map(
    input.outcomes.map((outcome) => [outcome.weekStart, outcome]),
  );
  const current = byStart.get(input.currentWeekStart);
  const currentSucceeded = current ? weekSucceeded(current) : false;

  let cursor = currentSucceeded
    ? input.currentWeekStart
    : addDaysToLocalDate(input.currentWeekStart, -7);

  let streak = 0;
  while (true) {
    const outcome = byStart.get(cursor);
    if (!outcome || !weekSucceeded(outcome)) {
      break;
    }
    streak += 1;
    cursor = addDaysToLocalDate(cursor, -7);
  }
  return streak;
}
