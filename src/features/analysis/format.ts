import type { AnalysisStatus } from "@/features/analysis/types";

export function analysisStatusLabel(
  status: AnalysisStatus | null,
  options?: { limitExceeded?: boolean },
): string {
  if (!status) {
    return options?.limitExceeded ? "한도 초과로 미분석" : "분석 전";
  }

  switch (status) {
    case "PENDING":
      return "분석 중";
    case "COMPLETED":
      return "완료";
    case "FAILED":
      return "실패";
    case "STALE":
      return "오래됨";
    default:
      return "분석 전";
  }
}
