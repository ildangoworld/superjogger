import { analysisStatusLabel } from "@/features/analysis/format";
import { ReanalyzeButton } from "@/features/analysis/components/reanalyze-button";
import type { AnalysisStatus, RiskLevel } from "@/features/analysis/types";

export type AnalysisPanelData = {
  status: AnalysisStatus;
  summary: string | null;
  intensityInterpretation: string | null;
  trend: string | null;
  nextWorkoutSuggestion: string | null;
  safetyNotice: string | null;
  riskLevel: RiskLevel | null;
};

export function AnalysisPanel({
  workoutId,
  analysis,
  remainingSlots,
  limitExceededOnSave,
}: {
  workoutId: string;
  analysis: AnalysisPanelData | null;
  remainingSlots: number;
  limitExceededOnSave?: boolean;
}) {
  const status = analysis?.status ?? null;
  const showCompletedFields =
    analysis &&
    (status === "COMPLETED" || status === "STALE") &&
    analysis.summary;

  return (
    <section className="mt-8 flex flex-col gap-4">
      <div>
        <h2 className="text-pine-900 text-lg font-semibold">AI 분석</h2>
        <p className="text-muted mt-1 text-sm">
          {analysisStatusLabel(status, {
            limitExceeded: Boolean(limitExceededOnSave) && !analysis,
          })}
        </p>
      </div>

      {limitExceededOnSave && !analysis ? (
        <p className="border-dawn-300 bg-dawn-50 text-dawn-900 rounded-lg border px-3 py-2 text-sm">
          오늘 제공되는 AI 분석 3회를 모두 사용했어요. 운동 기록은 정상적으로
          저장됐어요.
        </p>
      ) : null}

      {status === "PENDING" ? (
        <p className="text-muted text-sm leading-6">
          분석을 준비 중이에요. 잠시 후 이 화면을 새로고침해 보세요.
        </p>
      ) : null}

      {status === "FAILED" ? (
        <p className="text-muted text-sm leading-6">
          이번 분석을 완료하지 못했어요. 기록은 그대로 보관돼요.
        </p>
      ) : null}

      {status === "STALE" ? (
        <p className="border-dawn-300 bg-dawn-50 text-dawn-900 rounded-lg border px-3 py-2 text-sm">
          기록이 바뀌어 이전 분석이 오래됐어요. 필요하면 다시 분석해 주세요.
        </p>
      ) : null}

      {showCompletedFields ? (
        <dl className="flex flex-col gap-4 text-sm">
          <div>
            <dt className="text-muted">이번 운동 요약</dt>
            <dd className="text-pine-900 mt-1 leading-6">{analysis.summary}</dd>
          </div>
          <div>
            <dt className="text-muted">강도 해석</dt>
            <dd className="text-pine-900 mt-1 leading-6">
              {analysis.intensityInterpretation}
            </dd>
          </div>
          <div>
            <dt className="text-muted">최근 흐름</dt>
            <dd className="text-pine-900 mt-1 leading-6">{analysis.trend}</dd>
          </div>
          <div>
            <dt className="text-muted">다음 운동 제안</dt>
            <dd className="text-pine-900 mt-1 leading-6">
              {analysis.nextWorkoutSuggestion}
            </dd>
          </div>
          {analysis.safetyNotice ? (
            <div>
              <dt className="text-muted">안전 안내</dt>
              <dd className="text-dawn-900 mt-1 leading-6 font-medium">
                {analysis.safetyNotice}
              </dd>
            </div>
          ) : null}
          {analysis.riskLevel && analysis.riskLevel !== "NONE" ? (
            <div>
              <dt className="text-muted">주의 수준</dt>
              <dd className="text-pine-900 mt-1 font-medium">
                {analysis.riskLevel === "HIGH" ? "높음" : "주의"}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {!analysis && !limitExceededOnSave ? (
        <p className="text-muted text-sm leading-6">
          아직 분석 결과가 없어요. 남은 횟수가 있으면 다시 분석할 수 있어요.
        </p>
      ) : null}

      <ReanalyzeButton workoutId={workoutId} remainingSlots={remainingSlots} />
    </section>
  );
}
