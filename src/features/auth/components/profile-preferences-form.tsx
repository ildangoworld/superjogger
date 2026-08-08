"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState } from "react";
import {
  updateRecommendationDetail,
  type ActionResult,
} from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";
import type { RecommendationDetail } from "@/features/auth/types";
import { Modal } from "@/components/layout/modal";
import {
  setNextWeekGoal,
  type GoalActionResult,
} from "@/features/goals/actions";

type Props = {
  recommendationDetail: RecommendationDetail;
  nextWeekStart: string;
  recommendedCount: number;
  recommendationReason: string;
  confirmedCount: number | null;
};

type SaveResult = ActionResult | GoalActionResult;

const saveInitial: SaveResult = { ok: false };

const CHOICE_CLASS =
  "border-line text-pine-800 has-checked:bg-pine-800 has-checked:text-fog-50 flex min-h-12 cursor-pointer items-center justify-center rounded-lg border bg-transparent px-1 py-1.5 text-center text-sm font-medium transition-colors has-checked:border-transparent";

const DETAIL_LABELS: Record<RecommendationDetail, string> = {
  LIGHT: "가볍게",
  DETAILED: "구체적으로",
};

export function ProfilePreferencesForm({
  recommendationDetail,
  nextWeekStart,
  recommendedCount,
  recommendationReason,
  confirmedCount,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const defaultTarget = confirmedCount ?? recommendedCount;
  const [selectedTarget, setSelectedTarget] = useState(defaultTarget);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const [saveState, saveAction, savePending] = useActionState(
    async (_prev: SaveResult, formData: FormData): Promise<SaveResult> => {
      const goalResult = await setNextWeekGoal({ ok: false }, formData);
      if (!goalResult.ok) {
        return goalResult;
      }
      const detailResult = await updateRecommendationDetail(
        { ok: false },
        formData,
      );
      if (!detailResult.ok) {
        return detailResult;
      }
      startTransition(() => {
        setToast("저장했어요.");
        router.refresh();
      });
      return { ok: true, message: "저장했어요." };
    },
    saveInitial,
  );

  return (
    <>
      <section className="border-line flex items-center gap-3 rounded-xl border bg-white/60 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-pine-900 text-base font-semibold">설정</h2>
          <p className="text-muted mt-0.5 truncate text-sm">
            다음 주 목표 주 {defaultTarget}회 · AI 추천{" "}
            {DETAIL_LABELS[recommendationDetail]}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedTarget(confirmedCount ?? recommendedCount);
            setOpen(true);
          }}
          className="border-line text-pine-800 hover:bg-pine-50 shrink-0 rounded-lg border px-3 py-2 text-sm font-medium"
        >
          변경
        </button>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="설정" wide>
        <form action={saveAction} className="flex flex-col gap-6">
          <p className="border-pine-200 bg-pine-50 text-pine-900 rounded-lg border px-3 py-3 text-sm leading-6">
            다음 주({nextWeekStart})부터{" "}
            <span className="font-semibold">주 {selectedTarget}회</span>{" "}
            목표로 적용돼요. 이번 주 목표는 바뀌지 않아요.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-pine-900 text-sm font-semibold">
                다음 주 목표
              </h3>
              <p className="text-muted mt-1 text-sm leading-6">
                이번 주 목표는 주중에 낮출 수 없어요.
              </p>
            </div>

            <div className="border-pine-200 border-l-2 pl-4">
              <p className="text-pine-900 text-sm font-medium">추천</p>
              <p className="mt-1 text-2xl font-semibold">
                주 {recommendedCount}회
              </p>
              <p className="text-muted mt-2 text-sm leading-6">
                {recommendationReason}
              </p>
            </div>

            <fieldset>
              <legend className="text-pine-900 mb-1.5 text-sm font-medium">
                확정할 다음 주 목표
              </legend>
              <div className="grid grid-cols-7 gap-1.5">
                {([1, 2, 3, 4, 5, 6, 7] as const).map((count) => (
                  <label key={count} className={CHOICE_CLASS}>
                    <input
                      type="radio"
                      name="targetCount"
                      value={count}
                      checked={selectedTarget === count}
                      onChange={() => setSelectedTarget(count)}
                      className="sr-only"
                      required
                    />
                    {count}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-pine-900 text-sm font-semibold">
                AI 추천 상세도
              </h3>
              <p className="text-muted mt-1 text-sm leading-6">
                AI가 목표·분석을 얼마나 자세히 설명할지 정해요.
              </p>
            </div>
            <fieldset>
              <legend className="sr-only">AI 추천 상세도</legend>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    ["LIGHT", "가볍게"],
                    ["DETAILED", "구체적으로"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className={CHOICE_CLASS}>
                    <input
                      type="radio"
                      name="recommendationDetail"
                      value={value}
                      defaultChecked={recommendationDetail === value}
                      className="sr-only"
                      required
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <AuthMessage
            result={
              saveState.ok ? null : saveState.message ? saveState : null
            }
          />

          <button
            type="submit"
            disabled={savePending}
            className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-12 rounded-lg font-semibold disabled:opacity-60"
          >
            {savePending ? "저장 중" : "저장하기"}
          </button>
        </form>
      </Modal>

      {toast ? (
        <div
          role="status"
          className="bg-pine-800 text-fog-50 pointer-events-none fixed inset-x-0 bottom-24 z-50 mx-auto w-fit rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
