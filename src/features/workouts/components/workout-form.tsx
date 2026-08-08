"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  createWorkout,
  updateWorkout,
  type WorkoutActionResult,
} from "@/features/workouts/actions";
import type { WorkoutFormValues } from "@/features/workouts/components/workout-form-values";
import { WORKOUT_CATEGORY_LABELS } from "@/features/workouts/types";
import type { WorkoutCategory } from "@/features/workouts/types";
import {
  cadenceFromStepCount,
  durationPartsToSeconds,
  secondsToDurationParts,
  stepCountFromCadence,
} from "@/features/workouts/qualification";

type Props = {
  mode: "create" | "edit";
  workoutId?: string;
  initial: WorkoutFormValues;
};

const initialResult: WorkoutActionResult = { ok: false };

type CadenceLinkSource = "cadence" | "stepCount";

const DISTANCE_MAX_WHOLE_KM = 999;
const WHEEL_ITEM_HEIGHT = 40;
const WHEEL_VISIBLE_COUNT = 3;
const WHEEL_PAD =
  ((WHEEL_VISIBLE_COUNT - 1) / 2) * WHEEL_ITEM_HEIGHT;
const WHEEL_HEIGHT = WHEEL_VISIBLE_COUNT * WHEEL_ITEM_HEIGHT;

const HOUR_VALUES = Array.from({ length: 24 }, (_, index) => index);
const MINUTE_SECOND_VALUES = Array.from({ length: 60 }, (_, index) => index);
const DISTANCE_WHOLE_VALUES = Array.from(
  { length: DISTANCE_MAX_WHOLE_KM + 1 },
  (_, index) => index,
);
const DECIMAL_DIGIT_VALUES = Array.from({ length: 10 }, (_, index) => index);

const PERCEIVED_EXERTION_OPTIONS = [
  { value: 1, label: "아주 쉬움" },
  { value: 2, label: "쉬움" },
  { value: 3, label: "보통" },
  { value: 4, label: "힘듦" },
  { value: 5, label: "아주 힘듦" },
] as const;

const CONDITION_OPTIONS = [
  { value: 5, label: "매우 좋음" },
  { value: 4, label: "좋음" },
  { value: 3, label: "보통" },
  { value: 2, label: "나쁨" },
  { value: 1, label: "아주 나쁨" },
] as const;

function roundDistanceKm(value: number): number {
  return Math.min(
    DISTANCE_MAX_WHOLE_KM + 0.99,
    Math.max(0, Math.round(value * 100) / 100),
  );
}

function splitDistanceKm(km: number): {
  whole: number;
  tenths: number;
  hundredths: number;
} {
  const rounded = roundDistanceKm(km);
  const whole = Math.floor(rounded + Number.EPSILON);
  const cents = Math.round((rounded - whole) * 100);
  return {
    whole,
    tenths: Math.floor(cents / 10),
    hundredths: cents % 10,
  };
}

function joinDistanceKm(
  whole: number,
  tenths: number,
  hundredths: number,
): number {
  return roundDistanceKm(whole + tenths / 10 + hundredths / 100);
}

function parseOptionalInt(raw: string): number | null {
  if (raw.trim() === "") {
    return null;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return null;
  }
  return Math.max(0, Math.round(value));
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

const FIELD_GROUP_CLASS = "flex flex-col gap-1.5 text-sm";
const FIELD_TITLE_CLASS = "text-pine-900 text-sm font-medium";
const FIELDSET_TITLE_CLASS = `${FIELD_TITLE_CLASS} float-left mb-1.5 w-full p-0`;

function ScoreLabel({ label }: { label: string }) {
  const parts = label.split(/\s+/);
  if (parts.length < 2) {
    return label;
  }
  return (
    <span className="flex flex-col items-center gap-0.5 leading-tight">
      <span>{parts[0]}</span>
      <span>{parts.slice(1).join(" ")}</span>
    </span>
  );
}

function ScoreChoiceField({
  name,
  label,
  options,
  value,
  onChange,
}: {
  name: string;
  label: string;
  options: readonly { value: number; label: string }[];
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <fieldset>
      <legend className={FIELDSET_TITLE_CLASS}>{label}</legend>
      <div className="grid clear-both grid-cols-5 gap-1.5">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex min-h-14 cursor-pointer items-center justify-center rounded-lg px-1 py-1.5 text-center text-sm font-medium transition-colors ${
                selected
                  ? "bg-pine-800 text-fog-50"
                  : "border-line text-pine-800 border bg-transparent"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <ScoreLabel label={option.label} />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function WheelColumn({
  ariaLabel,
  values,
  value,
  onChange,
  format = String,
}: {
  ariaLabel: string;
  values: number[];
  value: number;
  onChange: (next: number) => void;
  format?: (value: number) => string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settlingRef = useRef(false);

  useEffect(() => {
    const el = listRef.current;
    if (!el || settlingRef.current) {
      return;
    }
    const index = values.indexOf(value);
    if (index < 0) {
      return;
    }
    const top = index * WHEEL_ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - top) > 1) {
      el.scrollTop = top;
    }
  }, [value, values]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current != null) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  function commitFromScroll() {
    const el = listRef.current;
    if (!el) {
      return;
    }
    const index = Math.min(
      values.length - 1,
      Math.max(0, Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT)),
    );
    const top = index * WHEEL_ITEM_HEIGHT;
    settlingRef.current = true;
    el.scrollTo({ top, behavior: "smooth" });
    const next = values[index];
    if (next != null && next !== value) {
      onChange(next);
    }
    window.setTimeout(() => {
      settlingRef.current = false;
    }, 120);
  }

  function handleScroll() {
    if (scrollTimeoutRef.current != null) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      commitFromScroll();
    }, 80);
  }

  return (
    <div
      className="relative min-h-0 min-w-0 flex-1 overflow-hidden"
      style={{ height: WHEEL_HEIGHT, maxHeight: WHEEL_HEIGHT }}
      aria-label={ariaLabel}
    >
      <div
        aria-hidden
        className="border-pine-200 pointer-events-none absolute inset-x-1 top-1/2 z-0 h-10 -translate-y-1/2 rounded-md border bg-pine-50/80"
      />
      <div
        aria-hidden
        className="from-fog-50 pointer-events-none absolute inset-x-0 top-0 z-20 h-8 bg-gradient-to-b to-transparent"
      />
      <div
        aria-hidden
        className="from-fog-50 pointer-events-none absolute inset-x-0 bottom-0 z-20 h-8 bg-gradient-to-t to-transparent"
      />
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="absolute inset-0 z-10 snap-y snap-mandatory overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div style={{ height: WHEEL_PAD }} aria-hidden />
        {values.map((item) => {
          const selected = item === value;
          return (
            <div
              key={item}
              className={`flex snap-center items-center justify-center tabular-nums transition-colors ${
                selected
                  ? "text-pine-900 text-lg font-bold"
                  : "text-fog-500 text-base font-medium opacity-45"
              }`}
              style={{ height: WHEEL_ITEM_HEIGHT }}
              aria-current={selected ? "true" : undefined}
            >
              {format(item)}
            </div>
          );
        })}
        <div style={{ height: WHEEL_PAD }} aria-hidden />
      </div>
    </div>
  );
}

function DurationWheelField({
  hours,
  minutes,
  seconds,
  onChange,
}: {
  hours: number;
  minutes: number;
  seconds: number;
  onChange: (hours: number, minutes: number, seconds: number) => void;
}) {
  return (
    <div className={FIELD_GROUP_CLASS}>
      <span className={FIELD_TITLE_CLASS}>운동시간</span>
      <div>
        <div className="mb-1.5 flex">
          <span className="text-muted flex-1 text-center text-xs">시</span>
          <span className="text-muted flex-1 text-center text-xs">분</span>
          <span className="text-muted flex-1 text-center text-xs">초</span>
        </div>
        <div
          className="border-line bg-fog-50 flex items-center overflow-hidden rounded-lg border"
          style={{ height: WHEEL_HEIGHT }}
        >
          <WheelColumn
            ariaLabel="시"
            values={HOUR_VALUES}
            value={hours}
            onChange={(next) => onChange(next, minutes, seconds)}
          />
          <WheelColumn
            ariaLabel="분"
            values={MINUTE_SECOND_VALUES}
            value={minutes}
            format={pad2}
            onChange={(next) => onChange(hours, next, seconds)}
          />
          <WheelColumn
            ariaLabel="초"
            values={MINUTE_SECOND_VALUES}
            value={seconds}
            format={pad2}
            onChange={(next) => onChange(hours, minutes, next)}
          />
        </div>
      </div>
      <input type="hidden" name="hours" value={hours} />
      <input type="hidden" name="minutes" value={minutes} />
      <input type="hidden" name="seconds" value={seconds} />
    </div>
  );
}

function DistanceWheelField({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const parts = splitDistanceKm(value);

  return (
    <div className={FIELD_GROUP_CLASS}>
      <span className={FIELD_TITLE_CLASS}>거리 (km)</span>
      <div
        className="border-line bg-fog-50 flex items-center overflow-hidden rounded-lg border"
        style={{ height: WHEEL_HEIGHT }}
      >
        <WheelColumn
          ariaLabel="거리 정수 km"
          values={DISTANCE_WHOLE_VALUES}
          value={parts.whole}
          onChange={(whole) =>
            onChange(joinDistanceKm(whole, parts.tenths, parts.hundredths))
          }
        />
        <div
          aria-hidden
          className="text-pine-900 px-0.5 text-xl font-semibold"
        >
          .
        </div>
        <WheelColumn
          ariaLabel="거리 소수 첫째 자리"
          values={DECIMAL_DIGIT_VALUES}
          value={parts.tenths}
          onChange={(tenths) =>
            onChange(joinDistanceKm(parts.whole, tenths, parts.hundredths))
          }
        />
        <WheelColumn
          ariaLabel="거리 소수 둘째 자리"
          values={DECIMAL_DIGIT_VALUES}
          value={parts.hundredths}
          onChange={(hundredths) =>
            onChange(joinDistanceKm(parts.whole, parts.tenths, hundredths))
          }
        />
      </div>
      <input type="hidden" name="distanceKm" value={value} />
    </div>
  );
}

export function WorkoutForm({ mode, workoutId, initial }: Props) {
  const action = mode === "create" ? createWorkout : updateWorkout;
  const [state, formAction, pending] = useActionState(action, initialResult);
  const initialDuration = secondsToDurationParts(initial.durationSeconds);
  const [hasPain, setHasPain] = useState(initial.hasPain);
  const [distanceKm, setDistanceKm] = useState(
    roundDistanceKm(initial.distanceKm),
  );
  const [hours, setHours] = useState(initialDuration.hours);
  const [minutes, setMinutes] = useState(initialDuration.minutes);
  const [seconds, setSeconds] = useState(initialDuration.seconds);
  const [perceivedExertion, setPerceivedExertion] = useState(
    initial.perceivedExertion,
  );
  const [conditionScore, setConditionScore] = useState(initial.conditionScore);
  const [cadence, setCadence] = useState(
    initial.cadence != null ? String(initial.cadence) : "",
  );
  const [stepCount, setStepCount] = useState(
    initial.stepCount != null ? String(initial.stepCount) : "",
  );
  const [cadenceLinkSource, setCadenceLinkSource] =
    useState<CadenceLinkSource | null>(null);

  const durationSeconds = durationPartsToSeconds(hours, minutes, seconds);

  function syncFromCadence(nextCadence: number | null) {
    if (nextCadence == null) {
      return;
    }
    const nextSteps = stepCountFromCadence(nextCadence, durationSeconds);
    if (nextSteps != null) {
      setStepCount(String(nextSteps));
    }
  }

  function syncFromStepCount(nextSteps: number | null) {
    if (nextSteps == null) {
      return;
    }
    const nextCadence = cadenceFromStepCount(nextSteps, durationSeconds);
    if (nextCadence != null) {
      setCadence(String(nextCadence));
    }
  }

  function applyDurationChange(
    nextHours: number,
    nextMinutes: number,
    nextSeconds: number,
  ) {
    setHours(nextHours);
    setMinutes(nextMinutes);
    setSeconds(nextSeconds);
    const nextDuration = durationPartsToSeconds(
      nextHours,
      nextMinutes,
      nextSeconds,
    );
    if (cadenceLinkSource === "cadence") {
      const currentCadence = parseOptionalInt(cadence);
      if (currentCadence != null) {
        const nextSteps = stepCountFromCadence(currentCadence, nextDuration);
        if (nextSteps != null) {
          setStepCount(String(nextSteps));
        }
      }
      return;
    }
    if (cadenceLinkSource === "stepCount") {
      const currentSteps = parseOptionalInt(stepCount);
      if (currentSteps != null) {
        const nextCadence = cadenceFromStepCount(currentSteps, nextDuration);
        if (nextCadence != null) {
          setCadence(String(nextCadence));
        }
      }
    }
  }

  function handleCadenceChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, "");
    setCadence(raw);
    setCadenceLinkSource("cadence");
    syncFromCadence(parseOptionalInt(raw));
  }

  function handleStepCountChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, "");
    setStepCount(raw);
    setCadenceLinkSource("stepCount");
    syncFromStepCount(parseOptionalInt(raw));
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 pb-8">
      {workoutId ? (
        <input type="hidden" name="workoutId" value={workoutId} />
      ) : null}

      <fieldset>
        <legend className={FIELDSET_TITLE_CLASS}>운동 종류</legend>
        <div className="grid clear-both grid-cols-3 gap-1.5">
          {(Object.keys(WORKOUT_CATEGORY_LABELS) as WorkoutCategory[]).map(
            (category) => (
              <label
                key={category}
                className="border-line text-pine-800 has-checked:bg-pine-800 has-checked:text-fog-50 flex min-h-14 cursor-pointer items-center justify-center rounded-lg border bg-transparent px-1 py-1.5 text-center text-sm font-medium transition-colors has-checked:border-transparent"
              >
                <input
                  type="radio"
                  name="category"
                  value={category}
                  defaultChecked={initial.category === category}
                  className="sr-only"
                />
                <ScoreLabel label={WORKOUT_CATEGORY_LABELS[category]} />
              </label>
            ),
          )}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <label className={FIELD_GROUP_CLASS}>
          <span className={FIELD_TITLE_CLASS}>운동 날짜</span>
          <input
            type="date"
            name="localDate"
            required
            defaultValue={initial.localDate}
            className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
          />
        </label>
        <label className={FIELD_GROUP_CLASS}>
          <span className={FIELD_TITLE_CLASS}>시작 시각</span>
          <input
            type="time"
            name="localTime"
            required
            defaultValue={initial.localTime}
            className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
          />
        </label>
      </div>

      <DistanceWheelField value={distanceKm} onChange={setDistanceKm} />

      <DurationWheelField
        hours={hours}
        minutes={minutes}
        seconds={seconds}
        onChange={applyDurationChange}
      />

      <ScoreChoiceField
        name="perceivedExertion"
        label="체감 강도"
        options={PERCEIVED_EXERTION_OPTIONS}
        value={perceivedExertion}
        onChange={setPerceivedExertion}
      />

      <ScoreChoiceField
        name="conditionScore"
        label="컨디션"
        options={CONDITION_OPTIONS}
        value={conditionScore}
        onChange={setConditionScore}
      />

      <fieldset>
        <legend className={FIELDSET_TITLE_CLASS}>통증 여부</legend>
        <div className="flex clear-both flex-col gap-2">
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
        </div>
      </fieldset>

      {hasPain ? (
        <>
          <label className={FIELD_GROUP_CLASS}>
            <span className={FIELD_TITLE_CLASS}>통증 부위</span>
            <input
              name="painArea"
              defaultValue={initial.painArea ?? ""}
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
            />
          </label>
          <label className={FIELD_GROUP_CLASS}>
            <span className={FIELD_TITLE_CLASS}>통증 상세</span>
            <textarea
              name="painDetails"
              rows={3}
              defaultValue={initial.painDetails ?? ""}
              className="border-line bg-fog-50 focus:border-pine-500 rounded-lg border px-3 py-3 outline-none"
            />
          </label>
        </>
      ) : null}
      <details open className="border-line rounded-lg border px-3 py-3">
        <summary className={`${FIELD_TITLE_CLASS} cursor-pointer`}>
          선택 입력
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <label className={FIELD_GROUP_CLASS}>
            <span className={FIELD_TITLE_CLASS}>평균 심박수 (bpm)</span>
            <input
              type="number"
              name="averageHeartRate"
              min={30}
              max={250}
              defaultValue={initial.averageHeartRate ?? ""}
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
            />
          </label>
          <label className={FIELD_GROUP_CLASS}>
            <span className={FIELD_TITLE_CLASS}>평균 케이던스</span>
            <input
              type="text"
              inputMode="numeric"
              name="cadence"
              value={cadence}
              onFocus={(event) => event.currentTarget.select()}
              onChange={handleCadenceChange}
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
            />
          </label>
          <label className={FIELD_GROUP_CLASS}>
            <span className={FIELD_TITLE_CLASS}>걸음 수</span>
            <input
              type="text"
              inputMode="numeric"
              name="stepCount"
              value={stepCount}
              onFocus={(event) => event.currentTarget.select()}
              onChange={handleStepCountChange}
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
            />
          </label>
          <label className={FIELD_GROUP_CLASS}>
            <span className={FIELD_TITLE_CLASS}>메모</span>
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
          ? "저장 중"
          : mode === "create"
            ? "기록 저장"
            : "수정 저장"}
      </button>
    </form>
  );
}
