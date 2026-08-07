import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteWorkoutButton } from "@/features/workouts/components/delete-workout-button";
import {
  formatCategory,
  formatDistanceKm,
  formatDuration,
  formatLocalDateTimeLabel,
  goalStatusLabel,
} from "@/features/workouts/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "운동 상세" };

export default async function WorkoutDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; updated?: string; similar?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: workout }, { data: profile }] = await Promise.all([
    supabase
      .from("workouts")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!workout) {
    notFound();
  }

  const timezone = profile?.timezone ?? "Asia/Seoul";

  return (
    <div className="pt-6 pb-8">
      <p className="text-muted text-sm">
        <Link href="/workouts" className="hover:underline">
          기록
        </Link>
        <span aria-hidden> / </span>
        상세
      </p>
      <h1 className="text-pine-900 mt-3 text-2xl font-semibold">
        {formatCategory(workout.category)}
      </h1>
      <p className="text-muted mt-2 text-sm">
        {formatLocalDateTimeLabel(
          workout.local_date,
          workout.started_at,
          timezone,
        )}
      </p>

      {query.saved ? (
        <p className="border-pine-200 bg-pine-50 text-pine-800 mt-4 rounded-lg border px-3 py-2 text-sm">
          운동 기록을 저장했어요.
          {workout.counts_for_daily_goal
            ? " 이번 주 목표에도 반영됐어요."
            : workout.qualifies_by_rule
              ? " 인정 조건은 충족했지만, 같은 날 대표 기록이 이미 있어 목표 횟수에는 추가되지 않았어요."
              : " 이번 기록은 목표 인정 조건(10분 또는 1km)에 미달해 목표에는 반영되지 않았어요. 기록 자체는 안전하게 보관돼요."}
        </p>
      ) : null}

      {query.updated ? (
        <p className="border-pine-200 bg-pine-50 text-pine-800 mt-4 rounded-lg border px-3 py-2 text-sm">
          기록을 수정했고, 목표 반영을 다시 계산했어요.
        </p>
      ) : null}

      {query.similar ? (
        <p className="border-dawn-300 bg-dawn-50 text-dawn-900 mt-4 rounded-lg border px-3 py-2 text-sm">
          같은 날짜·거리·시간의 비슷한 기록이 이미 있어요. 등록은 막지 않았어요.
        </p>
      ) : null}

      <dl className="mt-8 flex flex-col gap-4 text-sm">
        <div>
          <dt className="text-muted">목표 반영</dt>
          <dd className="text-pine-900 mt-1 font-medium">
            {goalStatusLabel({
              qualifiesByRule: workout.qualifies_by_rule,
              countsForDailyGoal: workout.counts_for_daily_goal,
            })}
          </dd>
        </div>
        <div>
          <dt className="text-muted">거리</dt>
          <dd className="text-pine-900 mt-1 font-medium">
            {formatDistanceKm(workout.distance_meters)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">운동시간</dt>
          <dd className="text-pine-900 mt-1 font-medium">
            {formatDuration(workout.duration_seconds)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">체감 강도</dt>
          <dd className="text-pine-900 mt-1 font-medium">
            {workout.perceived_exertion} / 5
          </dd>
        </div>
        <div>
          <dt className="text-muted">컨디션</dt>
          <dd className="text-pine-900 mt-1 font-medium">
            {workout.condition_score} / 5
          </dd>
        </div>
        <div>
          <dt className="text-muted">통증</dt>
          <dd className="text-pine-900 mt-1 font-medium">
            {workout.has_pain
              ? [workout.pain_area, workout.pain_details]
                  .filter(Boolean)
                  .join(" · ") || "있음"
              : "없음"}
          </dd>
        </div>
        {workout.average_heart_rate != null ? (
          <div>
            <dt className="text-muted">평균 심박수</dt>
            <dd className="text-pine-900 mt-1 font-medium">
              {workout.average_heart_rate} bpm
            </dd>
          </div>
        ) : null}
        {workout.cadence != null ? (
          <div>
            <dt className="text-muted">케이던스</dt>
            <dd className="text-pine-900 mt-1 font-medium">{workout.cadence}</dd>
          </div>
        ) : null}
        {workout.step_count != null ? (
          <div>
            <dt className="text-muted">걸음 수</dt>
            <dd className="text-pine-900 mt-1 font-medium">
              {workout.step_count}
            </dd>
          </div>
        ) : null}
        {workout.memo ? (
          <div>
            <dt className="text-muted">메모</dt>
            <dd className="text-pine-900 mt-1 whitespace-pre-wrap">
              {workout.memo}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-muted">AI 분석</dt>
          <dd className="text-muted mt-1">
            아직 분석 전이에요. AI 분석은 다음 단계에서 연결돼요.
          </dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-col gap-3">
        <Link
          href={`/workouts/${workout.id}/edit`}
          className="bg-pine-800 text-fog-50 hover:bg-pine-700 inline-flex h-12 items-center justify-center rounded-lg font-semibold"
        >
          수정하기
        </Link>
        <DeleteWorkoutButton workoutId={workout.id} />
      </div>
    </div>
  );
}
