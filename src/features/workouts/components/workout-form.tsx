"use client";

import { useActionState, useState } from "react";
import {
  createWorkout,
  updateWorkout,
  type WorkoutActionResult,
} from "@/features/workouts/actions";
import { WORKOUT_CATEGORY_LABELS } from "@/features/workouts/types";
import type { WorkoutCategory } from "@/features/workouts/types";
import { secondsToDurationParts } from "@/features/workouts/qualification";
import { metersToKilometers } from "@/features/workouts/qualification";

type WorkoutFormValues = {
  category: WorkoutCategory;
  localDate: string;
  localTime: string;
  distanceKm: number;
  durationSeconds: number;
  perceivedExertion: number;
  conditionScore: number;
  hasPain: boolean;
  painArea: string | null;
  painDetails: string | null;
  averageHeartRate: number | null;
  cadence: number | null;
  stepCount: number | null;
  memo: string | null;
};

type Props = {
  mode: "create" | "edit";
  workoutId?: string;
  initial: WorkoutFormValues;
};

const initialResult: WorkoutActionResult = { ok: false };

export function WorkoutForm({ mode, workoutId, initial }: Props) {
  const action = mode === "create" ? createWorkout : updateWorkout;
  const [state, formAction, pending] = useActionState(action, initialResult);
  const duration = secondsToDurationParts(initial.durationSeconds);
  const [hasPain, setHasPain] = useState(initial.hasPain);

  return (
    <form action={formAction} className="flex flex-col gap-5 pb-8">
      {workoutId ? (
        <input type="hidden" name="workoutId" value={workoutId} />
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-pine-900 text-sm font-medium">카테고리</legend>
        {(Object.keys(WORKOUT_CATEGORY_LABELS) as WorkoutCategory[]).map(
          (category) => (
            <label
              key={category}
              className="border-line has-checked:border-pine-500 has-checked:bg-pine-50 flex items-center gap-3 rounded-lg border px-3 py-3 text-sm"
            >
              <input
                type="radio"
                name="category"
                value={category}
                defaultChecked={initial.category === category}
              />
              {WORKOUT_CATEGORY_LABELS[category]}
            </label>
          ),
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-pine-900 font-medium">운동 날짜</span>
          <input
            type="date"
            name="localDate"
            required
            defaultValue={initial.localDate}
            className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-pine-900 font-medium">시작 시각</span>
          <input
            type="time"
            name="localTime"
            required
            defaultValue={initial.localTime}
            className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">거리 (km)</span>
        <input
          type="number"
          name="distanceKm"
          min={0}
          step="0.01"
          required
          defaultValue={initial.distanceKm}
          className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
        />
      </label>

      <fieldset>
        <legend className="text-pine-900 mb-2 text-sm font-medium">
          운동시간
        </legend>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted">시</span>
            <input
              type="number"
              name="hours"
              min={0}
              max={23}
              defaultValue={duration.hours}
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted">분</span>
            <input
              type="number"
              name="minutes"
              min={0}
              max={59}
              defaultValue={duration.minutes}
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted">초</span>
            <input
              type="number"
              name="seconds"
              min={0}
              max={59}
              defaultValue={duration.seconds}
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
            />
          </label>
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">체감 강도 (1~5)</span>
        <input
          type="number"
          name="perceivedExertion"
          min={1}
          max={5}
          required
          defaultValue={initial.perceivedExertion}
          className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-pine-900 font-medium">컨디션 (1~5)</span>
        <input
          type="number"
          name="conditionScore"
          min={1}
          max={5}
          required
          defaultValue={initial.conditionScore}
          className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-pine-900 text-sm font-medium">통증 여부</legend>
        {(
          [
            [false, "통증 없어요"],
            [true, "통증이 있어요"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={String(value)}
            className="border-line has-checked:border-pine-500 has-checked:bg-pine-50 flex items-center gap-3 rounded-lg border px-3 py-3 text-sm"
          >
            <input
              type="radio"
              name="hasPain"
              value={String(value)}
              checked={hasPain === value}
              onChange={() => setHasPain(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      {hasPain ? (
        <>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-pine-900 font-medium">통증 부위</span>
            <input
              name="painArea"
              defaultValue={initial.painArea ?? ""}
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-pine-900 font-medium">통증 상세</span>
            <textarea
              name="painDetails"
              rows={3}
              defaultValue={initial.painDetails ?? ""}
              className="border-line bg-fog-50 focus:border-pine-500 rounded-lg border px-3 py-3 outline-none"
            />
          </label>
        </>
      ) : null}
      <details className="border-line rounded-lg border px-3 py-3">
        <summary className="text-pine-900 cursor-pointer text-sm font-medium">
          선택 입력
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-pine-900 font-medium">평균 심박수 (bpm)</span>
            <input
              type="number"
              name="averageHeartRate"
              min={30}
              max={250}
              defaultValue={initial.averageHeartRate ?? ""}
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-pine-900 font-medium">케이던스</span>
            <input
              type="number"
              name="cadence"
              min={0}
              defaultValue={initial.cadence ?? ""}
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-pine-900 font-medium">걸음 수</span>
            <input
              type="number"
              name="stepCount"
              min={0}
              defaultValue={initial.stepCount ?? ""}
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-pine-900 font-medium">메모</span>
            <textarea
              name="memo"
              rows={3}
              defaultValue={initial.memo ?? ""}
              className="border-line bg-fog-50 focus:border-pine-500 rounded-lg border px-3 py-3 outline-none"
            />
          </label>
        </div>
      </details>

      {state.message ? (
        <p
          role="status"
          className="border-dawn-300 bg-dawn-50 text-dawn-900 rounded-lg border px-3 py-2 text-sm"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-12 rounded-lg font-semibold disabled:opacity-60"
      >
        {pending
          ? "저장 중…"
          : mode === "create"
            ? "기록 저장"
            : "수정 저장"}
      </button>
    </form>
  );
}

export function buildDefaultCreateValues(localDate: string): WorkoutFormValues {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return {
    category: "RUNNING",
    localDate,
    localTime: `${hours}:${minutes}`,
    distanceKm: 0,
    durationSeconds: 0,
    perceivedExertion: 3,
    conditionScore: 3,
    hasPain: false,
    painArea: null,
    painDetails: null,
    averageHeartRate: null,
    cadence: null,
    stepCount: null,
    memo: null,
  };
}

export function buildEditValues(input: {
  category: WorkoutCategory;
  localDate: string;
  localTime: string;
  distanceMeters: number;
  durationSeconds: number;
  perceivedExertion: number;
  conditionScore: number;
  hasPain: boolean;
  painArea: string | null;
  painDetails: string | null;
  averageHeartRate: number | null;
  cadence: number | null;
  stepCount: number | null;
  memo: string | null;
}): WorkoutFormValues {
  return {
    category: input.category,
    localDate: input.localDate,
    localTime: input.localTime,
    distanceKm: metersToKilometers(input.distanceMeters),
    durationSeconds: input.durationSeconds,
    perceivedExertion: input.perceivedExertion,
    conditionScore: input.conditionScore,
    hasPain: input.hasPain,
    painArea: input.painArea,
    painDetails: input.painDetails,
    averageHeartRate: input.averageHeartRate,
    cadence: input.cadence,
    stepCount: input.stepCount,
    memo: input.memo,
  };
}
