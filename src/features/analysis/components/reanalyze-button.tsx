"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reanalyzeWorkout } from "@/features/analysis/actions";

export function ReanalyzeButton({
  workoutId,
  remainingSlots,
}: {
  workoutId: string;
  remainingSlots: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending || remainingSlots <= 0}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await reanalyzeWorkout(workoutId);
            setMessage(
              result.message ??
                (result.ok
                  ? "분석을 업데이트했어요."
                  : "다시 분석하지 못했어요."),
            );
            if (result.ok) {
              router.refresh();
            }
          });
        }}
        className="border-line text-pine-800 h-11 rounded-lg border text-sm font-medium disabled:opacity-60"
      >
        {pending ? "재분석 중" : "다시 분석하기"}
      </button>
      <p className="text-muted text-xs">오늘 남은 분석 {remainingSlots}회</p>
      {message ? <p className="text-pine-800 text-sm">{message}</p> : null}
    </div>
  );
}
