import type { CrewProgressStatus } from "@/features/crews/types";

export function resolveCrewProgressStatus(input: {
  targetCount: number | null;
  qualifiedDayCount: number;
}): CrewProgressStatus {
  const qualified = Math.max(0, input.qualifiedDayCount);
  const target = input.targetCount;

  if (target != null && target > 0 && qualified >= target) {
    return "ACHIEVED";
  }
  if (qualified >= 1) {
    return "IN_PROGRESS";
  }
  return "NOT_STARTED";
}

export function achievementPercent(input: {
  targetCount: number | null;
  qualifiedDayCount: number;
}): number | null {
  if (input.targetCount == null || input.targetCount <= 0) {
    return null;
  }
  return Math.min(
    100,
    Math.round((input.qualifiedDayCount / input.targetCount) * 100),
  );
}

const STATUS_ORDER: Record<CrewProgressStatus, number> = {
  ACHIEVED: 0,
  IN_PROGRESS: 1,
  NOT_STARTED: 2,
};

export function compareCrewBoardMembers(
  a: { status: CrewProgressStatus; nickname: string },
  b: { status: CrewProgressStatus; nickname: string },
): number {
  const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  if (byStatus !== 0) {
    return byStatus;
  }
  return a.nickname.localeCompare(b.nickname, "ko");
}
