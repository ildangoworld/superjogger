"use client";

import { useActionState, useMemo, useState } from "react";
import {
  completeOnboarding,
  type ActionResult,
} from "@/features/auth/actions";
import { AuthMessage } from "@/features/auth/components/auth-message";
import { recommendWeeklyTarget } from "@/features/goals/recommend";
import type {
  ExperienceLevel,
  PrimaryGoal,
} from "@/features/goals/recommend";
import type { RecommendationDetail } from "@/features/auth/types";

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: "월" },
  { value: 2, label: "화" },
  { value: 3, label: "수" },
  { value: 4, label: "목" },
  { value: 5, label: "금" },
  { value: 6, label: "토" },
  { value: 7, label: "일" },
];

const EXPERIENCE: { value: ExperienceLevel; label: string }[] = [
  { value: "BEGINNER", label: "처음이에요" },
  { value: "RETURNING", label: "다시 시작해요" },
  { value: "REGULAR", label: "꾸준히 하는 편이에요" },
  { value: "ADVANCED", label: "꽤 익숙해요" },
];

const GOALS: { value: PrimaryGoal; label: string }[] = [
  { value: "HABIT", label: "운동 습관 만들기" },
  { value: "HEALTH", label: "건강 유지" },
  { value: "STRESS_RELIEF", label: "스트레스 풀기" },
  { value: "ENJOYMENT", label: "움직이는 즐거움" },
];

type Props = {
  initialNickname: string;
};

const initial: ActionResult = { ok: false };

export function OnboardingForm({ initialNickname }: Props) {
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState(initialNickname);
  const [baselineWeeklyFrequency, setBaselineWeeklyFrequency] = useState(2);
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>("BEGINNER");
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>("HABIT");
  const [availableWeekdays, setAvailableWeekdays] = useState<number[]>([
    1, 3, 5,
  ]);
  const [conditionScore, setConditionScore] = useState(3);
  const [hasPain, setHasPain] = useState(false);
  const [recommendationDetail, setRecommendationDetail] =
    useState<RecommendationDetail>("LIGHT");
  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [state, formAction, pending] = useActionState(
    completeOnboarding,
    initial,
  );

  const recommendation = useMemo(
    () =>
      recommendWeeklyTarget({
        baselineWeeklyFrequency,
        experienceLevel,
        availableWeekdays,
        conditionScore,
        hasPain,
      }),
    [
      baselineWeeklyFrequency,
      experienceLevel,
      availableWeekdays,
      conditionScore,
      hasPain,
    ],
  );

  const confirmedTarget = targetCount ?? recommendation.recommendedCount;

  function toggleWeekday(day: number) {
    setAvailableWeekdays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  function goNext() {
    if (step === 2) {
      setTargetCount(recommendation.recommendedCount);
    }
    setStep((value) => Math.min(value + 1, 3));
  }

  function submitOnboarding(formData: FormData) {
    formData.set(
      "timezone",
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul",
    );
    formAction(formData);
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <p className="text-pine-600 text-sm font-medium">
          온보딩 {step + 1} / 4
        </p>
        <h1 className="text-pine-900 mt-2 text-2xl font-semibold">
          {step === 0 && "나를 알려주세요"}
          {step === 1 && "운동 리듬을 알려주세요"}
          {step === 2 && "오늘 몸 상태는요?"}
          {step === 3 && "이번 주 목표를 확정해요"}
        </h1>
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-pine-900 font-medium">닉네임</span>
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
              maxLength={20}
            />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-pine-900 text-sm font-medium">
              AI 추천 상세도
            </legend>
            {(
              [
                ["LIGHT", "가볍게 — 방향만 간단히"],
                ["DETAILED", "구체적으로 — 시간과 강도까지"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="border-line has-checked:border-pine-500 has-checked:bg-pine-50 flex items-center gap-3 rounded-lg border px-3 py-3 text-sm"
              >
                <input
                  type="radio"
                  name="recommendationDetailUi"
                  checked={recommendationDetail === value}
                  onChange={() => setRecommendationDetail(value)}
                />
                {label}
              </label>
            ))}
          </fieldset>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-pine-900 font-medium">
              최근 한 달 평균 운동 횟수 (주당)
            </span>
            <input
              type="number"
              min={0}
              max={7}
              step={0.5}
              value={baselineWeeklyFrequency}
              onChange={(event) =>
                setBaselineWeeklyFrequency(Number(event.target.value))
              }
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
            />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-pine-900 text-sm font-medium">
              운동 경험
            </legend>
            {EXPERIENCE.map((item) => (
              <label
                key={item.value}
                className="border-line has-checked:border-pine-500 has-checked:bg-pine-50 flex items-center gap-3 rounded-lg border px-3 py-3 text-sm"
              >
                <input
                  type="radio"
                  checked={experienceLevel === item.value}
                  onChange={() => setExperienceLevel(item.value)}
                />
                {item.label}
              </label>
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-pine-900 text-sm font-medium">
              현재 목표
            </legend>
            {GOALS.map((item) => (
              <label
                key={item.value}
                className="border-line has-checked:border-pine-500 has-checked:bg-pine-50 flex items-center gap-3 rounded-lg border px-3 py-3 text-sm"
              >
                <input
                  type="radio"
                  checked={primaryGoal === item.value}
                  onChange={() => setPrimaryGoal(item.value)}
                />
                {item.label}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend className="text-pine-900 mb-2 text-sm font-medium">
              현실적으로 운동 가능한 요일
            </legend>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const selected = availableWeekdays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    className={`h-10 min-w-10 rounded-lg px-3 text-sm font-medium transition-colors ${
                      selected
                        ? "bg-pine-800 text-fog-50"
                        : "border-line text-pine-800 border bg-transparent"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-pine-900 font-medium">
              현재 컨디션 (1~5)
            </span>
            <input
              type="range"
              min={1}
              max={5}
              value={conditionScore}
              onChange={(event) => setConditionScore(Number(event.target.value))}
              className="accent-pine-700"
            />
            <span className="text-muted">{conditionScore}점</span>
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-pine-900 text-sm font-medium">
              통증 여부
            </legend>
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
                  checked={hasPain === value}
                  onChange={() => setHasPain(value)}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <p className="text-muted text-sm leading-6">
            통증이 있으면 운동보다 휴식과 전문가 상담을 우선하세요. AI는 의료
            진단을 하지 않아요.
          </p>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="border-pine-200 border-l-2 pl-4">
            <p className="text-pine-900 text-sm font-medium">추천 목표</p>
            <p className="mt-1 text-3xl font-semibold">
              주 {recommendation.recommendedCount}회
            </p>
            <p className="text-muted mt-3 text-sm leading-6">
              {recommendation.reason}
            </p>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-pine-900 font-medium">
              내가 확정할 이번 주 목표 (1~7회)
            </span>
            <input
              type="number"
              min={1}
              max={7}
              value={confirmedTarget}
              onChange={(event) => setTargetCount(Number(event.target.value))}
              className="border-line bg-fog-50 focus:border-pine-500 h-12 rounded-lg border px-3 outline-none"
            />
          </label>
        </div>
      )}

      <AuthMessage result={state.ok || state.message ? state : null} />

      <div className="flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((value) => value - 1)}
            className="border-line text-pine-800 h-12 flex-1 rounded-lg border font-medium"
          >
            이전
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={
              (step === 0 && nickname.trim().length < 2) ||
              (step === 1 && availableWeekdays.length === 0)
            }
            className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-12 flex-1 rounded-lg font-semibold disabled:opacity-60"
          >
            다음
          </button>
        ) : (
          <form action={submitOnboarding} className="flex-1">
            <input type="hidden" name="nickname" value={nickname.trim()} />
            <input
              type="hidden"
              name="baselineWeeklyFrequency"
              value={baselineWeeklyFrequency}
            />
            <input
              type="hidden"
              name="experienceLevel"
              value={experienceLevel}
            />
            <input type="hidden" name="primaryGoal" value={primaryGoal} />
            <input
              type="hidden"
              name="availableWeekdays"
              value={availableWeekdays.join(",")}
            />
            <input type="hidden" name="conditionScore" value={conditionScore} />
            <input type="hidden" name="hasPain" value={String(hasPain)} />
            <input
              type="hidden"
              name="recommendationDetail"
              value={recommendationDetail}
            />
            <input type="hidden" name="targetCount" value={confirmedTarget} />
            <button
              type="submit"
              disabled={pending}
              className="bg-pine-800 text-fog-50 hover:bg-pine-700 h-12 w-full rounded-lg font-semibold disabled:opacity-60"
            >
              {pending ? "저장 중" : "목표 확정하고 시작하기"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
