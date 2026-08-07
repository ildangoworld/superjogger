import type { JoggerGrade } from "@/features/goals/types";

export type WeekOutcome = {
  weekStart: string;
  goalCount: number;
  qualifiedDayCount: number;
};

export type JoggerGradeResult = {
  grade: JoggerGrade;
  achievementRate: number | null;
  completedWeekCountSinceStart: number;
  evaluatedWeekCount: number;
  successfulWeekCount: number;
  isProvisional: boolean;
  explanation: string;
};

function gradeFromRate(rate: number): Exclude<JoggerGrade, "PENDING"> {
  if (rate >= 88) {
    return "LEGENDARY";
  }
  if (rate >= 75) {
    return "UNIQUE";
  }
  if (rate >= 60) {
    return "EPIC";
  }
  if (rate >= 40) {
    return "RARE";
  }
  return "NORMAL";
}

/**
 * Weekly success is binary: qualified days >= goal count.
 * Exceeding the goal still counts as a single success.
 */
export function weekSucceeded(outcome: WeekOutcome): boolean {
  return (
    outcome.goalCount > 0 && outcome.qualifiedDayCount >= outcome.goalCount
  );
}

/**
 * Jogger grade reflects consistency, not speed.
 * Pass completed week starts only — never include the in-progress current week.
 */
export function calculateJoggerGrade(input: {
  completedWeekStarts: string[];
  outcomes: WeekOutcome[];
}): JoggerGradeResult {
  const completedWeekCountSinceStart = input.completedWeekStarts.length;

  if (completedWeekCountSinceStart === 0) {
    return {
      grade: "PENDING",
      achievementRate: null,
      completedWeekCountSinceStart: 0,
      evaluatedWeekCount: 0,
      successfulWeekCount: 0,
      isProvisional: true,
      explanation:
        "아직 등급을 산정할 주간 기록이 없어요. 목표를 지키며 기록을 이어가면 등급이 생겨요.",
    };
  }

  if (completedWeekCountSinceStart < 2) {
    return {
      grade: "PENDING",
      achievementRate: null,
      completedWeekCountSinceStart,
      evaluatedWeekCount: 0,
      successfulWeekCount: 0,
      isProvisional: true,
      explanation:
        "처음 2주 동안은 등급 산정 중이에요. 지금은 나만의 리듬을 만드는 시간이에요.",
    };
  }

  // From the 3rd week onward (2+ completed weeks), compute provisional or formal grade.
  const windowStarts =
    completedWeekCountSinceStart < 8
      ? input.completedWeekStarts
      : input.completedWeekStarts.slice(-8);

  const outcomeByWeek = new Map(
    input.outcomes.map((outcome) => [outcome.weekStart, outcome]),
  );

  let evaluatedWeekCount = 0;
  let successfulWeekCount = 0;

  for (const weekStart of windowStarts) {
    const outcome = outcomeByWeek.get(weekStart);
    if (!outcome || outcome.goalCount <= 0) {
      continue;
    }
    evaluatedWeekCount += 1;
    if (weekSucceeded(outcome)) {
      successfulWeekCount += 1;
    }
  }

  if (evaluatedWeekCount === 0) {
    return {
      grade: "PENDING",
      achievementRate: null,
      completedWeekCountSinceStart,
      evaluatedWeekCount: 0,
      successfulWeekCount: 0,
      isProvisional: true,
      explanation:
        "완료된 주에 확정된 목표가 아직 없어 등급을 계산하지 못했어요.",
    };
  }

  const achievementRate = Math.round(
    (successfulWeekCount / evaluatedWeekCount) * 100,
  );
  const grade = gradeFromRate(achievementRate);
  const isProvisional = completedWeekCountSinceStart < 8;

  return {
    grade,
    achievementRate,
    completedWeekCountSinceStart,
    evaluatedWeekCount,
    successfulWeekCount,
    isProvisional,
    explanation: isProvisional
      ? `임시 등급이에요. 완료된 ${evaluatedWeekCount}주 기준 달성률 ${achievementRate}%예요. 8주가 쌓이면 정식 등급으로 바뀌어요.`
      : `최근 완료된 ${evaluatedWeekCount}주 기준 달성률 ${achievementRate}%예요. 순위가 아니라 나의 꾸준함을 보여주는 상태예요.`,
  };
}
