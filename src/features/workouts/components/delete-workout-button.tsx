"use client";

import { useActionState } from "react";
import {
  deleteWorkout,
  type WorkoutActionResult,
} from "@/features/workouts/actions";

const initial: WorkoutActionResult = { ok: false };

export function DeleteWorkoutButton({ workoutId }: { workoutId: string }) {
  const [state, action, pending] = useActionState(deleteWorkout, initial);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "이 운동 기록을 삭제할까요? 삭제 후 같은 날의 다른 기록이 있으면 목표 인정이 다시 계산돼요.",
          )
        ) {
          event.preventDefault();
        }
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="workoutId" value={workoutId} />
      <button
        type="submit"
        disabled={pending}
        className="text-dawn-900 h-11 text-sm font-medium underline-offset-4 hover:underline disabled:opacity-60"
      >
        {pending ? "삭제 중" : "기록 삭제"}
      </button>
      {state.message ? (
        <p className="text-dawn-900 text-sm">{state.message}</p>
      ) : null}
    </form>
  );
}
