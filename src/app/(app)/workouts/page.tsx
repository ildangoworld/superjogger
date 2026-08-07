import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  formatCategory,
  formatDistanceKm,
  formatDuration,
  goalStatusLabel,
} from "@/features/workouts/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "기록" };

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workouts, error } = await supabase
    .from("workouts")
    .select(
      "id, category, local_date, started_at, duration_seconds, distance_meters, qualifies_by_rule, counts_for_daily_goal",
    )
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (error) {
    return (
      <p className="text-muted mt-8 text-sm">
        기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
      </p>
    );
  }

  return (
    <div className="pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-pine-900 text-2xl font-semibold">기록</h1>
          <p className="text-muted mt-2 text-sm leading-6">
            최신 운동부터 확인할 수 있어요.
          </p>
        </div>
        <Link
          href="/record"
          className="bg-pine-800 text-fog-50 hover:bg-pine-700 inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold"
        >
          기록하기
        </Link>
      </div>

      {params.deleted ? (
        <p className="border-pine-200 bg-pine-50 text-pine-800 mt-4 rounded-lg border px-3 py-2 text-sm">
          기록을 삭제했고, 목표 반영을 다시 계산했어요.
        </p>
      ) : null}

      {!workouts || workouts.length === 0 ? (
        <div className="mt-10">
          <p className="text-pine-900 text-base font-medium">
            아직 기록이 없어요
          </p>
          <p className="text-muted mt-2 text-sm leading-6">
            오늘 몸에 맞게 10분부터 움직여보고 기록을 남겨보세요.
          </p>
          <Link
            href="/record"
            className="text-pine-700 mt-4 inline-flex text-sm font-medium underline-offset-4 hover:underline"
          >
            첫 기록 남기기
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {workouts.map((workout) => (
            <li key={workout.id}>
              <Link
                href={`/workouts/${workout.id}`}
                className="border-line hover:border-pine-300 block rounded-lg border px-4 py-4 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-pine-900 font-semibold">
                    {formatCategory(workout.category)}
                  </p>
                  <p className="text-muted text-xs">{workout.local_date}</p>
                </div>
                <p className="text-muted mt-2 text-sm">
                  {formatDuration(workout.duration_seconds)} ·{" "}
                  {formatDistanceKm(workout.distance_meters)}
                </p>
                <p className="text-pine-700 mt-2 text-xs font-medium">
                  {goalStatusLabel({
                    qualifiesByRule: workout.qualifies_by_rule,
                    countsForDailyGoal: workout.counts_for_daily_goal,
                  })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
