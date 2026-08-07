"use client";

import { useActionState } from "react";
import {
  setNextWeekGoal,
  type GoalActionResult,
} from "@/features/goals/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";

type Props = {
  nextWeekStart: string;
  recommendedCount: number;
  recommendationReason: string;
  confirmedCount: number | null;
};

const initial: GoalActionResult = { ok: false };

export function NextWeekGoalForm({
  nextWeekStart,
  recommendedCount,
  recommendationReason,
  confirmedCount,
}: Props) {
  const [state, action, pending] = useActionState(setNextWeekGoal, initial);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-pine-900 text-lg font-semibold">다음 주 목표</h2>
        <p className="text-muted mt-1 text-sm leading-6">
          이번 주 목표는 주중에 낮출 수 없어요. 변경은 다음 주(
          {nextWeekStart})부터 적용돼요.
        </p>
      </div>

      <div className="border-pine-200 border-l-2 pl-4">
        <p className="text-pine-900 text-sm font-medium">추천</p>
        <p className="mt-1 text-2xl font-semibold">주 {recommendedCount}회</p>
        <p className="text-muted mt-2 text-sm leading-6">
          {recommendationReason}
        </p>
      </div>

      <form action={action} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-pine-900 font-medium">
            확정할 다음 주 목표 (1~7회)
          </span>
          <input
            type="number"
            name="targetCount"
            min={1}
            max={7}
            required
            defaultValue={confirmedCount ?? recommendedCount}
            className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
          />
        </label>
        <AuthMessage result={state.ok || state.message ? state : null} />
        <button
          type="submit"
          disabled={pending}
          className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-12 rounded-lg font-semibold disabled:opacity-60"
        >
          {pending
            ? "저장 중…"
            : confirmedCount
              ? "다음 주 목표 수정"
              : "다음 주 목표 확정"}
        </button>
      </form>
    </section>
  );
}
