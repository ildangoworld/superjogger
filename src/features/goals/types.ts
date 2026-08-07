export type JoggerGrade =
  | "NORMAL"
  | "RARE"
  | "EPIC"
  | "UNIQUE"
  | "LEGENDARY"
  | "PENDING";

export const JOGGER_GRADE_LABELS: Record<JoggerGrade, string> = {
  NORMAL: "노말 조거",
  RARE: "레어 조거",
  EPIC: "에픽 조거",
  UNIQUE: "유니크 조거",
  LEGENDARY: "레전더리 조거",
  PENDING: "등급 산정 중",
};

export type WeeklyGoal = {
  id: string;
  userId: string;
  weekStart: string;
  targetCount: number;
  recommendedCount: number | null;
  recommendationReason: string | null;
  confirmedAt: string;
};
