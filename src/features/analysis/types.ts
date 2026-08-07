export type AnalysisStatus = "PENDING" | "COMPLETED" | "FAILED" | "STALE";

export type AnalysisTriggerType = "AUTO" | "REANALYZE";

export type AnalysisUsageStatus = "RESERVED" | "CONSUMED" | "RELEASED";

export type RiskLevel = "NONE" | "CAUTION" | "HIGH";

export type WorkoutAnalysisResult = {
  summary: string;
  intensityInterpretation: string;
  trend: string;
  nextWorkoutSuggestion: string;
  safetyNotice: string | null;
  trendSummaryForNextAnalysis: string;
  riskLevel: RiskLevel;
};
